// OWNER: Gameplay
// Versione iniziale (Architecture): Gameplay la rifinisce. Modalita' guidate dalla fase dello store:
//   loading|menu -> 'menu' (orbita lenta attorno a Tony)   intro -> 'intro' (dolly verso il follow)
//   playing|paused -> 'follow'   dialogue -> 'dialogue'   ending -> 'celebration'
// Scrive runtime.camera (yaw/pitch/distance); legge input.consumeLook e settings (distanza, sensibilita').
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { colliderRegistry, raycast2D } from '@/game/core/collision';
import { CAMERA_LIMITS, LOOK_RADIANS_PER_PIXEL, MAX_FRAME_DT } from '@/game/core/constants';
import { input } from '@/game/core/input';
import { damp } from '@/game/movement/movementMath';
import { gameStore, runtime, type GamePhase } from '@/store/gameStore';
import type { CameraMode } from '@/store/runtime';

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

export function ThirdPersonCamera() {
  const scratch = useMemo(
    () => ({
      desired: new Vector3(),
      lookDesired: new Vector3(),
      look: new Vector3(),
      delta: { x: 0, y: 0 },
      orbit: 0,
      initialized: false,
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
    const targetY = p.y + CAMERA_LIMITS.targetHeight;

    // look (mouse / touch): solo mentre si gioca
    input.consumeLook(scratch.delta);
    if (gs.phase === 'playing' && (scratch.delta.x !== 0 || scratch.delta.y !== 0)) {
      const k = LOOK_RADIANS_PER_PIXEL * settings.mouseSensitivity;
      cam.yaw -= scratch.delta.x * k;
      cam.pitch = Math.min(
        CAMERA_LIMITS.maxPitch,
        Math.max(CAMERA_LIMITS.minPitch, cam.pitch + scratch.delta.y * k),
      );
      gs.advanceTutorial('look');
    }

    let rate: number;
    if (mode === 'menu') {
      scratch.orbit += dt * (settings.reducedMotion ? 0.03 : 0.12);
      const r = 7;
      scratch.desired.set(
        p.x + Math.sin(scratch.orbit) * r,
        2.6,
        p.z + Math.cos(scratch.orbit) * r,
      );
      scratch.lookDesired.set(p.x, p.y + 1.1, p.z);
      rate = 2;
    } else if (mode === 'dialogue') {
      const d = runtime.dialogue;
      const mx = d.hasTarget ? (p.x + d.targetX) / 2 : p.x;
      const mz = d.hasTarget ? (p.z + d.targetZ) / 2 : p.z;
      const dx = d.hasTarget ? d.targetX - p.x : Math.sin(p.rotationY);
      const dz = d.hasTarget ? d.targetZ - p.z : Math.cos(p.rotationY);
      const len = Math.max(Math.hypot(dx, dz), 0.001);
      scratch.desired.set(mx - (dz / len) * 3.2, targetY + 0.2, mz + (dx / len) * 3.2);
      scratch.lookDesired.set(mx, targetY, mz);
      rate = 5;
    } else if (mode === 'celebration') {
      scratch.desired.set(
        p.x + Math.sin(p.rotationY) * 3.6,
        targetY + 0.3,
        p.z + Math.cos(p.rotationY) * 3.6,
      );
      scratch.lookDesired.set(p.x, targetY, p.z);
      rate = 4;
    } else {
      // follow / intro
      const dist = settings.cameraDistance;
      const cp = Math.cos(cam.pitch);
      const dx = -Math.sin(cam.yaw) * cp;
      const dz = -Math.cos(cam.yaw) * cp;
      const hit = raycast2D(
        p.x,
        p.z,
        p.x + dx * dist,
        p.z + dz * dist,
        colliderRegistry.list(),
        0.3,
      );
      const eff = Math.max(1.5, dist * hit);
      cam.distance = damp(cam.distance, eff, 10, dt);
      scratch.desired.set(
        p.x + dx * cam.distance,
        targetY + Math.sin(cam.pitch) * cam.distance,
        p.z + dz * cam.distance,
      );
      scratch.lookDesired.set(p.x, targetY, p.z);
      rate = mode === 'intro' ? 2.5 : 10;
    }

    if (!scratch.initialized) {
      state.camera.position.copy(scratch.desired);
      scratch.look.copy(scratch.lookDesired);
      scratch.initialized = true;
    } else {
      const a = 1 - Math.exp(-rate * dt);
      state.camera.position.lerp(scratch.desired, a);
      scratch.look.lerp(scratch.lookDesired, a);
    }
    state.camera.lookAt(scratch.look);
  });

  return null;
}
