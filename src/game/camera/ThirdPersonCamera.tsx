// OWNER: Gameplay
// Camera in terza persona guidata dalla fase dello store:
//   loading|menu -> 'menu'   (arco lento attorno a Tony in posa, sul fondale della piazza)
//   intro        -> 'intro'  (dolly cinematografico dall'alto verso il follow)
//   playing|paused -> 'follow' (dietro e sopra Tony, mouse/touch look, pitch limitato, anti-occlusione)
//   dialogue     -> 'dialogue' (inquadratura laterale Tony + interlocutore)
//   ending       -> 'celebration' (frontale su Tony in posa teatrale)
// Scrive runtime.camera (yaw/pitch/distance); legge input.consumeLook e settings. Nessuna allocazione per frame.
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type PerspectiveCamera } from 'three';
import { raycast2D } from '@/game/core/collision';
import { CAMERA_LIMITS, LOOK_RADIANS_PER_PIXEL, MAX_FRAME_DT } from '@/game/core/constants';
import { input } from '@/game/core/input';
import type { ColliderShape } from '@/game/core/types';
import { damp } from '@/game/movement/movementMath';
import { reachTutorial } from '@/game/systems/tutorial';
import { gameStore, runtime, type GamePhase } from '@/store/gameStore';
import type { CameraMode } from '@/store/runtime';
import { PIAZZA_COLLIDERS } from '@/world/environments/piazzaColliders';
import { createShotOut, dialogueShot, followBackVector, menuOrbitAngle } from './cameraShots';

export function cameraModeForPhase(phase: GamePhase): CameraMode {
  switch (phase) {
    case 'loading':
    case 'menu':
      return 'menu';
    case 'intro':
      return 'intro';
    case 'dialogue':
      return 'dialogue';
    case 'ending':
      return 'celebration';
    default:
      return 'follow';
  }
}

/** Solo le masse grandi (muri, gradinata, cassonetto): lampioni, alberi e panchine non fanno "zoomare". */
const OCCLUDERS: readonly ColliderShape[] = PIAZZA_COLLIDERS.filter(
  (c) => c.kind === 'box' && Math.min(c.maxX - c.minX, c.maxZ - c.minZ) >= 0.9,
);

/** Altezza del punto guardato sopra i piedi di Tony (World: testa ~1.63, spalle ~1.4). */
const FOLLOW_TARGET_Y = 1.5;
const DIALOGUE_LOOK_Y = 1.6;
const MIN_CAMERA_Y = 0.45;
const BASE_FOV = 55;
const RUN_FOV_BONUS = 6;
const MIN_DISTANCE = 1.4;

export function ThirdPersonCamera() {
  const scratch = useMemo(
    () => ({
      desired: new Vector3(),
      lookDesired: new Vector3(),
      look: new Vector3(),
      delta: { x: 0, y: 0 },
      back: { x: 0, y: 0, z: 0 },
      shot: createShotOut(),
      alt: createShotOut(),
      side: 1 as 1 | -1,
      initialized: false,
      fov: BASE_FOV,
    }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DT);
    const gs = gameStore.getState();
    const mode = cameraModeForPhase(gs.phase);
    const p = runtime.player;
    const cam = runtime.camera;
    const settings = gs.settings;
    const reduced = settings.reducedMotion;
    const t = state.clock.elapsedTime;

    // look (mouse / touch): sempre consumato, applicato solo mentre si gioca
    input.consumeLook(scratch.delta);
    if (gs.phase === 'playing' && (scratch.delta.x !== 0 || scratch.delta.y !== 0)) {
      const k = LOOK_RADIANS_PER_PIXEL * settings.mouseSensitivity;
      cam.yaw -= scratch.delta.x * k;
      cam.pitch = Math.min(
        CAMERA_LIMITS.maxPitch,
        Math.max(CAMERA_LIMITS.minPitch, cam.pitch + scratch.delta.y * k),
      );
      reachTutorial('look');
    }

    let posRate: number;
    let lookRate: number;
    let fovTarget = BASE_FOV;

    if (mode === 'menu') {
      const a = p.rotationY + menuOrbitAngle(t, reduced);
      const r = 6.2;
      scratch.desired.set(
        p.x + Math.sin(a) * r,
        1.9 + (reduced ? 0 : Math.sin(t * 0.3) * 0.25),
        p.z + Math.cos(a) * r,
      );
      scratch.lookDesired.set(p.x, p.y + 1.25, p.z);
      posRate = 2.5;
      lookRate = 3;
    } else if (mode === 'dialogue') {
      const d = runtime.dialogue;
      // lato preferito: quello in cui sta gia' la camera (niente salti); se un muro copre, l'altro
      const cx = state.camera.position.x;
      const cz = state.camera.position.z;
      dialogueShot(p.x, p.z, d.targetX, d.targetZ, d.hasTarget, p.rotationY, 1, scratch.shot);
      dialogueShot(p.x, p.z, d.targetX, d.targetZ, d.hasTarget, p.rotationY, -1, scratch.alt);
      const dPlus = (scratch.shot.camX - cx) ** 2 + (scratch.shot.camZ - cz) ** 2;
      const dMinus = (scratch.alt.camX - cx) ** 2 + (scratch.alt.camZ - cz) ** 2;
      let preferred: 1 | -1 = dPlus <= dMinus ? 1 : -1;
      const blocked = (s: typeof scratch.shot): number =>
        raycast2D(s.lookX, s.lookZ, s.camX, s.camZ, OCCLUDERS, 0.3);
      const hitPref = blocked(preferred === 1 ? scratch.shot : scratch.alt);
      if (hitPref < 0.85) {
        const hitOther = blocked(preferred === 1 ? scratch.alt : scratch.shot);
        if (hitOther > hitPref) preferred = preferred === 1 ? -1 : 1;
      }
      scratch.side = preferred;
      const s = preferred === 1 ? scratch.shot : scratch.alt;
      const hit = Math.min(1, blocked(s));
      const camX = s.lookX + (s.camX - s.lookX) * hit;
      const camZ = s.lookZ + (s.camZ - s.lookZ) * hit;
      scratch.desired.set(camX, p.y + DIALOGUE_LOOK_Y + 0.2, camZ);
      scratch.lookDesired.set(s.lookX, p.y + DIALOGUE_LOOK_Y, s.lookZ);
      posRate = 4.5;
      lookRate = 8;
    } else if (mode === 'celebration') {
      const a = p.rotationY + (reduced ? 0 : Math.sin(t * 0.45) * 0.5);
      const r = 3.8;
      scratch.desired.set(
        p.x + Math.sin(a) * r,
        p.y + FOLLOW_TARGET_Y + 0.25,
        p.z + Math.cos(a) * r,
      );
      scratch.lookDesired.set(p.x, p.y + FOLLOW_TARGET_Y - 0.05, p.z);
      posRate = 3;
      lookRate = 6;
    } else {
      // follow / intro
      const intro = mode === 'intro';
      const dist = Math.min(
        CAMERA_LIMITS.maxDistance,
        Math.max(CAMERA_LIMITS.minDistance, settings.cameraDistance),
      );
      const pitch = intro ? Math.min(CAMERA_LIMITS.maxPitch, cam.pitch + 0.25) : cam.pitch;
      const wanted = intro ? dist * 1.6 : dist;
      const back = followBackVector(cam.yaw, pitch, scratch.back);
      const ty = p.y + FOLLOW_TARGET_Y;
      // anti-occlusione: accorcia la distanza se un muro e' in mezzo (raggio 2D dal punto guardato)
      const hit = raycast2D(
        p.x,
        p.z,
        p.x + back.x * wanted,
        p.z + back.z * wanted,
        OCCLUDERS,
        0.35,
      );
      const eff = hit >= 1 ? wanted : Math.max(MIN_DISTANCE, wanted * hit);
      // se si avvicina e' piu' reattiva (non attraversa il muro), se si allontana e' dolce
      cam.distance = damp(cam.distance, eff, eff < cam.distance ? 18 : 4, dt);
      scratch.desired.set(
        p.x + back.x * cam.distance,
        Math.max(MIN_CAMERA_Y, ty + back.y * cam.distance),
        p.z + back.z * cam.distance,
      );
      scratch.lookDesired.set(p.x, ty, p.z);
      posRate = intro ? 2.2 : 9;
      lookRate = intro ? 3 : 14;
      if (!reduced && gs.phase === 'playing' && input.run && Math.hypot(p.vx, p.vz) > 3) {
        fovTarget = BASE_FOV + RUN_FOV_BONUS;
      }
    }

    if (!scratch.initialized) {
      state.camera.position.copy(scratch.desired);
      scratch.look.copy(scratch.lookDesired);
      scratch.initialized = true;
    } else {
      const a = 1 - Math.exp(-posRate * dt);
      state.camera.position.lerp(scratch.desired, a);
      scratch.look.lerp(scratch.lookDesired, 1 - Math.exp(-lookRate * dt));
    }
    state.camera.lookAt(scratch.look);

    // leggero allargamento del campo visivo in corsa (solo prospettica)
    const pc = state.camera as PerspectiveCamera;
    if (pc.isPerspectiveCamera) {
      scratch.fov = damp(scratch.fov, fovTarget, 4, dt);
      if (Math.abs(pc.fov - scratch.fov) > 0.02) {
        pc.fov = scratch.fov;
        pc.updateProjectionMatrix();
      }
    }
  });

  return null;
}
