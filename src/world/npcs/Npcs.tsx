// OWNER: Gameplay
// Istanzia gli NPC dai dati (content.npcs): modello (World), collider, interagibile, attenzione
// "TUTTI GUARDANO TONY" (src/game/systems/attention.ts), idle, nuvolette comiche e indicatori "!".
// Scrive SOLO head/torso.rotation del rig (pivot riservati al Gameplay), mai altro del modello.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { content } from '@/data';
import { colliderRegistry } from '@/game/core/collision';
import { ATTENTION_DEFAULT_RADIUS, NPC_COLLIDER_RADIUS } from '@/game/core/constants';
import type { IdleBehaviour, NpcDefinition } from '@/game/core/types';
import { interactionRegistry, npcToInteractable } from '@/game/interactions/registry';
import {
  computeAttention,
  createAttentionOutput,
  createReactionState,
  stepAttention,
  updateReaction,
  type AttentionPose,
} from '@/game/systems/attention';
import { QuestMarkers } from '@/game/systems/QuestMarkers';
import { SpeechBubbleLayer } from '@/game/systems/SpeechBubbleLayer';
import { showBubble } from '@/game/systems/speechBubbles';
import { gameStore, runtime } from '@/store/gameStore';
import { NpcModel, type NpcRig } from './NpcModel';

const MAX_DT = 0.05;
/** Raggio entro cui un NPC "commenta" il passaggio di Tony con una nuvoletta. */
const BUBBLE_RADIUS = 4.5;

function poseFor(def: NpcDefinition): 'stand' | 'sit' | 'lean' {
  return def.idleBehaviour === 'sit' ? 'sit' : def.idleBehaviour === 'lean' ? 'lean' : 'stand';
}

interface IdleStyle {
  /** Ampiezza (rad) e frequenza (Hz) dello sguardo che vaga quando Tony non c'e'. */
  yaw: number;
  freq: number;
  /** Inclinazione fissa della testa (es. guarda il telefono). */
  pitch: number;
}

const IDLE: Readonly<Record<IdleBehaviour, IdleStyle>> = {
  stand: { yaw: 0.35, freq: 0.3, pitch: 0 },
  lean: { yaw: 0.2, freq: 0.25, pitch: 0.05 },
  phone: { yaw: 0.08, freq: 0.5, pitch: 0.5 },
  chat: { yaw: 0.28, freq: 0.7, pitch: 0 },
  sit: { yaw: 0.3, freq: 0.22, pitch: 0.05 },
  wave: { yaw: 0.4, freq: 0.9, pitch: 0 },
  pace: { yaw: 0.6, freq: 0.2, pitch: 0 },
};

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 628) / 100;
}

function NpcActor({ def }: { def: NpcDefinition }) {
  const rig = useRef<NpcRig>(null);
  const st = useMemo(
    () => ({
      att: createAttentionOutput(),
      pose: { headYaw: 0, torsoYaw: 0, headPitch: 0 } satisfies AttentionPose,
      target: { headYaw: 0, torsoYaw: 0, headPitch: 0 },
      reaction: createReactionState(),
      phase: hashPhase(def.id),
      ready: false,
    }),
    [def.id],
  );
  const eyeY = def.appearance.height * 0.9;
  const idle = IDLE[def.idleBehaviour];

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

  useFrame((state, delta) => {
    const r = rig.current;
    if (!r) return;
    const dt = Math.min(delta, MAX_DT);
    const gs = gameStore.getState();
    if (!st.ready) {
      // yaw esterno, pitch interno: la testa gira su Y e poi si inclina senza "rollare"
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
        radius: def.attentionRadius ?? ATTENTION_DEFAULT_RADIUS,
        wasActive: st.att.active,
        npcEyeY: eyeY,
      },
      st.att,
    );

    const calm = gs.settings.reducedMotion ? 0.3 : 1;
    const wander = Math.sin(state.clock.elapsedTime * idle.freq * Math.PI * 2 + st.phase);
    if (st.att.active) {
      st.target.headYaw = st.att.headYaw;
      st.target.torsoYaw = st.att.torsoYaw;
      st.target.headPitch = st.att.headPitch;
    } else {
      st.target.headYaw = wander * idle.yaw * calm;
      st.target.torsoYaw = 0;
      st.target.headPitch = idle.pitch;
    }
    stepAttention(st.pose, st.target, st.att.active, dt);
    r.head.rotation.y = st.pose.headYaw;
    r.head.rotation.x = st.pose.headPitch;
    r.torso.rotation.y = st.pose.torsoYaw;

    // Reazione comica: ingresso di Tony nel raggio (solo mentre si gioca).
    const inside =
      gs.phase === 'playing' &&
      Math.hypot(runtime.player.x - def.position[0], runtime.player.z - def.position[1]) <
        (def.attentionRadius ? def.attentionRadius * 0.65 : BUBBLE_RADIUS);
    if (def.ambientLines && def.ambientLines.length > 0) {
      const now = state.clock.elapsedTime;
      const text = updateReaction(st.reaction, inside, now, Math.random, def.ambientLines);
      if (text) showBubble(def.id, def.position[0], eyeY + 0.4, def.position[1], text, now);
    }
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
      <QuestMarkers />
      <SpeechBubbleLayer />
    </>
  );
}
