// OWNER: Finale. NPC delle tappe del flashback: NpcModel + attenzione "TUTTI GUARDANO TONY" (funzioni
// pure di src/game/systems/attention.ts) + collider. A Torre del Lago Bogdan e' anche il protagonista del
// K.O. tecnico: cade all'indietro in slow-motion, si siede a terra con le stelline sopra la testa.
// Nessuna allocazione in useFrame: tutto passa da ref e oggetti pre-allocati.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, OctahedronGeometry, type Group, type Mesh } from 'three';
import { content } from '@/data';
import { colliderRegistry } from '@/game/core/collision';
import { ATTENTION_DEFAULT_RADIUS, NPC_COLLIDER_RADIUS } from '@/game/core/constants';
import {
  computeAttention,
  createAttentionOutput,
  stepAttention,
  type AttentionPose,
} from '@/game/systems/attention';
import { gameStore, runtime } from '@/store/gameStore';
import { NpcModel, type NpcRig } from '@/world/npcs/NpcModel';
import type { FinaleCharacter } from '../data/cast';
import { KO_COLLAPSE_MS, collapseProgress, wobbleAmount } from '../logic/ko';

const MAX_DT = 0.05;
/** Inclinazione finale all'indietro della caduta (rad). */
const FALL_ANGLE = -1.35;
const STAR_COUNT = 3;

const starGeo = new OctahedronGeometry(0.08);
const starMat = new MeshBasicMaterial({ color: '#ffe14d' });

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 628) / 100;
}

/** Stesso aspetto dell'NPC Bogdan dei dati, se esiste; altrimenti quello di riserva. */
function appearanceOf(def: FinaleCharacter) {
  if (def.name !== 'Bogdan') return def.appearance;
  return content.npcs.find((n) => n.id === 'bogdan')?.appearance ?? def.appearance;
}

export function FinaleNpc({ def, knockOut = false }: { def: FinaleCharacter; knockOut?: boolean }) {
  const rig = useRef<NpcRig>(null);
  const pivot = useRef<Group>(null);
  const stars = useRef<Group>(null);
  const starMeshes = useRef<(Mesh | null)[]>([]);
  const appearance = useMemo(() => appearanceOf(def), [def]);
  const hip = appearance.height * 0.5;
  const st = useMemo(
    () => ({
      att: createAttentionOutput(),
      pose: { headYaw: 0, torsoYaw: 0, headPitch: 0 } satisfies AttentionPose,
      target: { headYaw: 0, torsoYaw: 0, headPitch: 0 },
      phase: hashPhase(def.id),
      ready: false,
    }),
    [def.id],
  );

  useEffect(() => {
    const id = `finale:npc:${def.id}`;
    colliderRegistry.add(id, {
      kind: 'circle',
      x: def.position[0],
      z: def.position[1],
      r: NPC_COLLIDER_RADIUS,
    });
    return () => {
      colliderRegistry.remove(id);
    };
  }, [def]);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!r) return;
    const dt = Math.min(delta, MAX_DT);
    const gs = gameStore.getState();
    if (!st.ready) {
      r.head.rotation.order = 'YXZ';
      st.ready = true;
    }
    computeAttention(
      {
        npcX: def.position[0],
        npcZ: def.position[1],
        npcRotationY: def.rotationY,
        tonyX: runtime.player.x,
        tonyZ: runtime.player.z,
        watchesTony: def.watchesTony,
        radius: ATTENTION_DEFAULT_RADIUS,
        wasActive: st.att.active,
        npcEyeY: appearance.height * 0.9,
      },
      st.att,
    );
    const calm = gs.settings.reducedMotion ? 0.3 : 1;
    if (st.att.active) {
      st.target.headYaw = st.att.headYaw;
      st.target.torsoYaw = st.att.torsoYaw;
      st.target.headPitch = st.att.headPitch;
    } else {
      st.target.headYaw = Math.sin(state.clock.elapsedTime * 1.9 + st.phase) * 0.3 * calm;
      st.target.torsoYaw = 0;
      st.target.headPitch = 0;
    }
    stepAttention(st.pose, st.target, st.att.active, dt);
    r.head.rotation.y = st.pose.headYaw;
    r.head.rotation.x = st.pose.headPitch;
    r.torso.rotation.y = st.pose.torsoYaw;

    if (!knockOut) return;
    const pv = pivot.current;
    if (!pv) return;
    const koAt = gs.finale.koStartedAt;
    const el = koAt === null ? -1 : Date.now() - koAt;
    if (el < 0) {
      pv.rotation.x = 0;
      pv.rotation.z = 0;
      pv.position.set(0, hip, 0);
      if (stars.current) stars.current.visible = false;
      return;
    }
    const p = collapseProgress(el);
    const wob = wobbleAmount(el);
    // dopo l'atterraggio un piccolo rimbalzo smorzato
    const since = Math.max(0, (el - KO_COLLAPSE_MS - 1100) / 1000);
    const bounce = p >= 1 ? 0.06 * Math.exp(-3.2 * since) * Math.sin(13 * since) : 0;
    const a = FALL_ANGLE * p + bounce;
    pv.rotation.x = a;
    pv.rotation.z = calm * Math.sin(el * 0.014) * 0.16 * wob;
    pv.position.y = hip * Math.cos(FALL_ANGLE * p) + Math.max(0, bounce) * 0.4;
    pv.position.z = -0.45 * p;
    const sg = stars.current;
    if (sg) {
      sg.visible = p > 0.75;
      if (sg.visible) {
        const t = el * 0.006;
        for (let i = 0; i < STAR_COUNT; i++) {
          const m = starMeshes.current[i];
          if (!m) continue;
          const ang = t + (i * Math.PI * 2) / STAR_COUNT;
          m.position.set(Math.cos(ang) * 0.34, Math.sin(t * 2 + i) * 0.05, Math.sin(ang) * 0.34);
          m.rotation.y = ang * 2;
        }
      }
    }
  });

  return (
    <group position={[def.position[0], 0, def.position[1]]} rotation={[0, def.rotationY, 0]}>
      <group ref={pivot} position={[0, hip, 0]}>
        <group position={[0, -hip, 0]}>
          <NpcModel ref={rig} appearance={appearance} pose={def.pose} />
        </group>
        {knockOut && (
          <group ref={stars} position={[0, appearance.height - hip + 0.32, 0]} visible={false}>
            {Array.from({ length: STAR_COUNT }, (_, i) => (
              <mesh
                key={i}
                geometry={starGeo}
                material={starMat}
                ref={(m) => {
                  starMeshes.current[i] = m;
                }}
              />
            ))}
          </group>
        )}
      </group>
    </group>
  );
}
