// OWNER: Gameplay
// Controller di Tony: input -> movimento relativo alla camera con accelerazione/decelerazione morbide,
// rotazione progressiva, corsa, collisioni (muri, props e NPC dal colliderRegistry), blocco in
// dialogo/pausa/finale, animazioni. UNICO scrittore di `runtime.player` e `runtime.anim`.
// Niente allocazioni per frame, niente setState per frame, dt clampato (frame-rate independent).
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { colliderRegistry, resolveCircleVsColliders } from '@/game/core/collision';
import { MAX_FRAME_DT, PLAYER_RADIUS, PLAYER_TURN_RATE } from '@/game/core/constants';
import { input } from '@/game/core/input';
import type { MutableVec2 } from '@/game/core/types';
import { TonyModel } from '@/game/entities/TonyModel';
import { damp, dampAngle, inputToWorldDirection } from '@/game/movement/movementMath';
import { playerSignals } from '@/game/systems/playerSignals';
import { reachTutorial } from '@/game/systems/tutorial';
import { gameStore, runtime } from '@/store/gameStore';

/**
 * Velocita' tarate sulle animazioni di Tony (World): la camminata satura a ~1.4 m/s di `anim.speed`
 * e la corsa e' ~5 m/s. Camminata un po' piu' veloce del ciclo per non rendere la piazza lenta.
 */
export const WALK_SPEED = 2.0;
export const RUN_SPEED = 5.0;
/** Sopra questa velocita' (m/s) l'animazione e' "run", sotto "walk". */
export const RUN_ANIM_THRESHOLD = 3.4;
/** Sotto questa velocita' Tony e' "idle". */
export const IDLE_SPEED = 0.12;
/** Fattori di smorzamento (1/s): salita piu' dolce, frenata piu' decisa. */
export const ACCEL_RATE = 9;
export const DECEL_RATE = 13;
/** Durata (ms) dell'animazione 'interact' all'apertura di un dialogo. */
const DIALOGUE_INTRO_MS = 650;

export function PlayerController() {
  const groupRef = useRef<Group>(null);
  const s = useMemo(
    () => ({
      dir: { x: 0, z: 0 } as MutableVec2,
      pos: { x: 0, z: 0 } as MutableVec2,
      prevPhase: 'loading' as string,
      dialogueIntroUntil: 0,
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DT);
    const state = gameStore.getState();
    const phase = state.phase;
    const p = runtime.player;
    const anim = runtime.anim;
    const nowMs = performance.now();

    if (phase === 'playing') {
      const axis = input.moveAxis;
      inputToWorldDirection(axis.x, axis.y, runtime.camera.yaw, s.dir);
      const mag = Math.min(1, Math.hypot(s.dir.x, s.dir.z));
      const hasInput = mag > 0.05;
      const running = hasInput && input.run;
      const top = running ? RUN_SPEED : WALK_SPEED;
      const nx = hasInput ? s.dir.x / mag : 0;
      const nz = hasInput ? s.dir.z / mag : 0;
      const rate = hasInput ? ACCEL_RATE : DECEL_RATE;
      p.vx = damp(p.vx, nx * top * mag, rate, dt);
      p.vz = damp(p.vz, nz * top * mag, rate, dt);

      if (Math.abs(p.vx) > 1e-4 || Math.abs(p.vz) > 1e-4) {
        s.pos.x = p.x + p.vx * dt;
        s.pos.z = p.z + p.vz * dt;
        resolveCircleVsColliders(s.pos, PLAYER_RADIUS, colliderRegistry.list());
        // velocita' effettiva dopo le collisioni (scorre lungo le pareti, si ferma contro i muri)
        p.vx = (s.pos.x - p.x) / dt;
        p.vz = (s.pos.z - p.z) / dt;
        p.x = s.pos.x;
        p.z = s.pos.z;
      } else {
        p.vx = 0;
        p.vz = 0;
      }
      if (hasInput) {
        p.rotationY = dampAngle(p.rotationY, Math.atan2(nx, nz), PLAYER_TURN_RATE, dt);
        reachTutorial('move');
        if (running) reachTutorial('run');
      }

      const ground = Math.hypot(p.vx, p.vz);
      anim.speed = ground;
      if (ground < IDLE_SPEED) {
        anim.speed = 0;
        anim.state = nowMs < playerSignals.interactUntilMs ? 'interact' : 'idle';
      } else {
        anim.state = ground > RUN_ANIM_THRESHOLD ? 'run' : 'walk';
      }
    } else if (phase === 'dialogue') {
      p.vx = 0;
      p.vz = 0;
      anim.speed = 0;
      if (s.prevPhase !== 'dialogue') s.dialogueIntroUntil = nowMs + DIALOGUE_INTRO_MS;
      const d = runtime.dialogue;
      if (d.hasTarget) {
        p.rotationY = dampAngle(
          p.rotationY,
          Math.atan2(d.targetX - p.x, d.targetZ - p.z),
          PLAYER_TURN_RATE,
          dt,
        );
      }
      const ds = state.dialogue.state;
      const line = ds.status === 'idle' || ds.status === 'ended' ? null : ds.line;
      if (nowMs < s.dialogueIntroUntil) anim.state = 'interact';
      else if (line?.speaker === 'tony') anim.state = line.gesture ? 'gesture' : 'talk';
      else anim.state = 'idle';
    } else if (phase === 'ending') {
      p.vx = 0;
      p.vz = 0;
      anim.speed = 0;
      // festeggia durante la celebrazione, poi resta nella posa teatrale
      anim.state = state.endingRevealed ? 'pose' : 'victory';
    } else if (phase === 'intro' || phase === 'paused') {
      p.vx = 0;
      p.vz = 0;
      anim.speed = 0;
      anim.state = 'idle';
    }
    // 'loading' / 'menu': la posa ('pose') e' impostata dallo store, non si tocca.
    s.prevPhase = phase;

    const g = groupRef.current;
    if (g) {
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = p.rotationY;
    }
  });

  return (
    <group ref={groupRef}>
      <TonyModel anim={runtime.anim} />
    </group>
  );
}
