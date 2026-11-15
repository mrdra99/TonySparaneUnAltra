// OWNER: Architecture
// Canvas R3F a schermo intero. La scena resta SEMPRE montata dietro i menu; la camera cambia modo
// in base alla fase (ThirdPersonCamera). Qualita' (dpr, ombre, antialias) dal profilo dispositivo.
import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { colliderRegistry } from '@/game/core/collision';
import { GAME_FLAGS } from '@/game/core/constants';
import { attachMouseLook, input } from '@/game/core/input';
import { ThirdPersonCamera } from '@/game/camera/ThirdPersonCamera';
import { InteractionSystem } from '@/game/interactions/InteractionSystem';
import { PlayerController } from '@/game/movement/PlayerController';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { Npcs } from '@/world/npcs/Npcs';
import { gameStore, useGameStore } from '@/store/gameStore';
import { Bicycle, Lighting, PIAZZA_COLLIDERS, PIAZZA_POINTS, Piazza } from './worldBindings';
import styles from './App.module.css';

/** Registra i collider statici della piazza per tutta la vita della scena. */
function WorldColliders() {
  useEffect(() => colliderRegistry.addMany('world:', PIAZZA_COLLIDERS), []);
  return null;
}

/** Segnala allo store che la scena e' pronta (Suspense risolto): loading -> menu. */
function SceneReady() {
  useEffect(() => {
    gameStore.getState().markSceneReady();
  }, []);
  return null;
}

function BikeProp() {
  const gag = useGameStore((s) => s.progress.flags.includes(GAME_FLAGS.bikeGag));
  return (
    <group position={[PIAZZA_POINTS.bike[0], 0, PIAZZA_POINTS.bike[1]]}>
      <Bicycle wobble={gag ? 1 : 0} />
    </group>
  );
}

export function GameCanvas() {
  const { isTouch, qualityProfile, preset } = useDeviceProfile();
  const containerRef = useRef<HTMLDivElement>(null);
  const phase = useGameStore((s) => s.phase);

  // Mouse look + pointer lock: SOLO desktop.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isTouch) return;
    return attachMouseLook(el, {
      enabled: () => gameStore.getState().phase === 'playing',
      onPointerLockLost: () => {
        if (gameStore.getState().phase === 'playing') input.trigger('pause');
      },
    });
  }, [isTouch]);

  // Rilascia il pointer lock fuori dal gioco attivo (menu, dialogo, pausa).
  useEffect(() => {
    if (phase !== 'playing' && typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [phase]);

  return (
    <div ref={containerRef} className={styles.canvas}>
      <Canvas
        shadows="percentage"
        dpr={[1, preset.dprMax]}
        gl={{ antialias: preset.antialias, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 200, position: [0, 6, 16] }}
      >
        <Suspense fallback={null}>
          <Lighting quality={qualityProfile} />
          <Piazza />
          <WorldColliders />
          <BikeProp />
          <Npcs />
          <PlayerController />
          <ThirdPersonCamera />
          <InteractionSystem />
          <SceneReady />
        </Suspense>
      </Canvas>
    </div>
  );
}
