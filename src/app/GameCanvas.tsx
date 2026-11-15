// OWNER: Architecture
// Canvas R3F a schermo intero. La scena resta SEMPRE montata dietro i menu; la camera cambia modo
// in base alla fase (ThirdPersonCamera). Qualita' (dpr, ombre, antialias) dal profilo dispositivo.
import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { attachMouseLook, input } from '@/game/core/input';
import { ThirdPersonCamera } from '@/game/camera/ThirdPersonCamera';
import { PlayerController } from '@/game/movement/PlayerController';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { FinaleLevel } from '@/levels/intercity/FinaleLevel';
import { LevelInteractionSystem } from '@/levels/intercity/LevelInteractionSystem';
import { isFlashbackLevel } from '@/levels/intercity/logic/ids';
import { gameStore, useGameStore } from '@/store/gameStore';
import { PiazzaLevel } from './PiazzaLevel';
import styles from './App.module.css';

/** Segnala allo store che la scena e' pronta (Suspense risolto): loading -> menu. */
function SceneReady() {
  useEffect(() => {
    gameStore.getState().markSceneReady();
  }, []);
  return null;
}

export function GameCanvas() {
  const { isTouch, qualityProfile, preset } = useDeviceProfile();
  const containerRef = useRef<HTMLDivElement>(null);
  const phase = useGameStore((s) => s.phase);
  const level = useGameStore((s) => s.level);

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
        camera={{ fov: 55, near: 0.1, far: 400, position: [0, 6, 16] }}
      >
        <Suspense fallback={null}>
          {/* un solo livello alla volta: gli NPC e gli interagibili della piazza non esistono nel flashback */}
          {isFlashbackLevel(level) ? (
            <>
              <FinaleLevel level={level} quality={qualityProfile} />
              <LevelInteractionSystem />
            </>
          ) : (
            <PiazzaLevel quality={qualityProfile} />
          )}
          <PlayerController />
          <ThirdPersonCamera />
          <SceneReady />
        </Suspense>
      </Canvas>
    </div>
  );
}
