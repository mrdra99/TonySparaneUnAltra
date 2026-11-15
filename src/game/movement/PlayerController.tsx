// OWNER: Gameplay
// Versione iniziale (Architecture) che dimostra il contratto: Gameplay la rifinisce/riscrive.
// Responsabilita': input -> movimento relativo alla camera, corsa, collisioni, blocco in dialogo,
// scrive `runtime.player` e `runtime.anim` (UNICO scrittore), sposta il gruppo che contiene TonyModel.
// Niente allocazioni per frame, niente setState per frame.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { colliderRegistry, resolveCircleVsColliders } from '@/game/core/collision';
import {
  MAX_FRAME_DT,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_TURN_RATE,
  PLAYER_WALK_SPEED,
} from '@/game/core/constants';
import { input } from '@/game/core/input';
import type { MutableVec2 } from '@/game/core/types';
import { dampAngle, inputToWorldDirection } from '@/game/movement/movementMath';
import { TonyModel } from '@/game/entities/TonyModel';
import { gameStore, runtime } from '@/store/gameStore';

export function PlayerController() {
  const groupRef = useRef<Group>(null);
  const scratch = useMemo(
    () => ({ dir: { x: 0, z: 0 } as MutableVec2, pos: { x: 0, z: 0 } as MutableVec2 }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DT);
    const state = gameStore.getState();
    const p = runtime.player;
    const anim = runtime.anim;

    if (state.phase === 'playing') {
      const axis = input.moveAxis;
      inputToWorldDirection(axis.x, axis.y, runtime.camera.yaw, scratch.dir);
      const mag = Math.min(1, Math.hypot(scratch.dir.x, scratch.dir.z));
      const running = input.run && mag > 0.01;
      const speed = mag > 0.01 ? (running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED) * mag : 0;
      if (mag > 0.01) {
        const nx = scratch.dir.x / mag;
        const nz = scratch.dir.z / mag;
        scratch.pos.x = p.x + nx * speed * dt;
        scratch.pos.z = p.z + nz * speed * dt;
        resolveCircleVsColliders(scratch.pos, PLAYER_RADIUS, colliderRegistry.list());
        p.vx = (scratch.pos.x - p.x) / Math.max(dt, 1e-6);
        p.vz = (scratch.pos.z - p.z) / Math.max(dt, 1e-6);
        p.x = scratch.pos.x;
        p.z = scratch.pos.z;
        p.rotationY = dampAngle(p.rotationY, Math.atan2(nx, nz), PLAYER_TURN_RATE, dt);
        state.advanceTutorial('move');
        if (running) state.advanceTutorial('run');
      } else {
        p.vx = 0;
        p.vz = 0;
      }
      const groundSpeed = Math.hypot(p.vx, p.vz);
      anim.speed = groundSpeed;
      anim.state = groundSpeed < 0.1 ? 'idle' : running ? 'run' : 'walk';
    } else if (state.phase === 'dialogue') {
      p.vx = 0;
      p.vz = 0;
      anim.speed = 0;
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
      anim.state = line?.speaker === 'tony' ? (line.gesture ? 'gesture' : 'talk') : 'idle';
    } else if (state.phase === 'ending') {
      anim.speed = 0;
      anim.state = 'victory';
    } else if (state.phase === 'intro') {
      anim.speed = 0;
      anim.state = 'idle';
    }

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
