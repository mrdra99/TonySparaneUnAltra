// OWNER: Gameplay
// Versione iniziale (Architecture). Istanzia gli NPC dai dati (content.npcs), registra per ciascuno
// collider + interagibile (con cleanup) e applica il sistema di attenzione (src/game/systems/attention.ts)
// ai pivot `head`/`torso` esposti da NpcModel (World). Le reazioni comiche (emote "👀") sono TODO di Gameplay.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { content } from '@/data';
import { colliderRegistry } from '@/game/core/collision';
import { NPC_COLLIDER_RADIUS } from '@/game/core/constants';
import type { NpcDefinition } from '@/game/core/types';
import { interactionRegistry, npcToInteractable } from '@/game/interactions/registry';
import { dampAngle } from '@/game/movement/movementMath';
import { computeAttention, type AttentionOutput } from '@/game/systems/attention';
import { runtime } from '@/store/runtime';
import { NpcModel, type NpcRig } from './NpcModel';

function poseFor(def: NpcDefinition): 'stand' | 'sit' | 'lean' {
  return def.idleBehaviour === 'sit' ? 'sit' : def.idleBehaviour === 'lean' ? 'lean' : 'stand';
}

function NpcActor({ def }: { def: NpcDefinition }) {
  const rig = useRef<NpcRig>(null);
  const att = useMemo<AttentionOutput>(
    () => ({ active: false, headYaw: 0, torsoYaw: 0, distance: 0 }),
    [],
  );

  useEffect(() => {
    const id = `npc:${def.id}`;
    colliderRegistry.add(id, {
      kind: 'circle',
      x: def.position[0],
      z: def.position[1],
      r: def.colliderRadius ?? NPC_COLLIDER_RADIUS,
    });
    const interactable = npcToInteractable(def);
    const off = interactable ? interactionRegistry.register(interactable) : undefined;
    return () => {
      colliderRegistry.remove(id);
      off?.();
    };
  }, [def]);

  useFrame((_, delta) => {
    const r = rig.current;
    if (!r) return;
    const dt = Math.min(delta, 0.05);
    computeAttention(
      {
        npcX: def.position[0],
        npcZ: def.position[1],
        npcRotationY: def.rotationY,
        tonyX: runtime.player.x,
        tonyZ: runtime.player.z,
        watchesTony: def.watchesTony,
        ...(def.attentionRadius !== undefined ? { radius: def.attentionRadius } : {}),
      },
      att,
    );
    r.head.rotation.y = dampAngle(r.head.rotation.y, att.headYaw, 6, dt);
    r.torso.rotation.y = dampAngle(r.torso.rotation.y, att.torsoYaw, 3, dt);
  });

  return (
    <group position={[def.position[0], 0, def.position[1]]} rotation={[0, def.rotationY, 0]}>
      <NpcModel ref={rig} appearance={def.appearance} pose={poseFor(def)} />
    </group>
  );
}

export function Npcs() {
  return (
    <>
      {content.npcs.map((def) => (
        <NpcActor key={def.id} def={def} />
      ))}
    </>
  );
}
