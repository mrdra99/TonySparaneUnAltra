// OWNER: UI/UX
// Stub funzionante (Architecture). Montato SOLO se useDeviceProfile().isTouch e fase 'playing'.
// Scrive nell'input unificato (mai eventi DOM verso i consumer):
//   joystick sinistro  -> input.setJoystick(x, y)  con y > 0 = avanti (schermo: su); reset su up/cancel
//   area destra (drag) -> input.addLookDelta(dx, dy) in pixel CSS
//   pulsante contestuale -> input.trigger('interact'), etichetta = store.nearbyPrompt
//   pulsanti pausa/missioni -> input.trigger('pause' | 'missions'); corsa: auto oltre 0.85 o setTouchRun
// Requisiti: target >= 44px, rispetto delle safe-area (--safe-*), touch-action: none, nessun hover-only.
import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { input } from '@/game/core/input';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useGameStore } from '@/store/gameStore';

const JOY_RADIUS = 56;

export function TouchControls() {
  const { isTouch } = useDeviceProfile();
  const phase = useGameStore((s) => s.phase);
  const prompt = useGameStore((s) => s.nearbyPrompt);
  const joyOrigin = useRef<{ id: number; x: number; y: number } | null>(null);
  const lookLast = useRef<{ id: number; x: number; y: number } | null>(null);

  if (!isTouch || phase !== 'playing') return null;

  const joyDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    e.currentTarget.setPointerCapture(e.pointerId);
    joyOrigin.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const joyMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const o = joyOrigin.current;
    if (!o || o.id !== e.pointerId) return;
    input.setJoystick((e.clientX - o.x) / JOY_RADIUS, -(e.clientY - o.y) / JOY_RADIUS);
  };
  const joyUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (joyOrigin.current?.id !== e.pointerId) return;
    joyOrigin.current = null;
    input.setJoystick(0, 0);
  };
  const lookDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lookLast.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const lookMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const l = lookLast.current;
    if (!l || l.id !== e.pointerId) return;
    input.addLookDelta(e.clientX - l.x, e.clientY - l.y);
    l.x = e.clientX;
    l.y = e.clientY;
  };
  const lookUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (lookLast.current?.id === e.pointerId) lookLast.current = null;
  };

  const zone = {
    position: 'absolute',
    bottom: 0,
    top: '30%',
    touchAction: 'none',
    pointerEvents: 'auto',
  } as const;
  return (
    <div style={{ position: 'absolute', inset: 0, touchAction: 'none' }}>
      <div
        style={{ ...zone, left: 0, width: '40%' }}
        onPointerDown={joyDown}
        onPointerMove={joyMove}
        onPointerUp={joyUp}
        onPointerCancel={joyUp}
      />
      <div
        style={{ ...zone, right: 0, width: '45%' }}
        onPointerDown={lookDown}
        onPointerMove={lookMove}
        onPointerUp={lookUp}
        onPointerCancel={lookUp}
      />
      {prompt && (
        <button
          style={{
            position: 'absolute',
            right: 'calc(var(--safe-right, 0px) + 16px)',
            bottom: 'calc(var(--safe-bottom, 0px) + 16px)',
            minHeight: 56,
            minWidth: 56,
            pointerEvents: 'auto',
          }}
          onClick={() => input.trigger('interact')}
        >
          {prompt}
        </button>
      )}
      <button
        style={{
          position: 'absolute',
          top: 'var(--safe-top, 0px)',
          left: '50%',
          minHeight: 44,
          minWidth: 44,
          pointerEvents: 'auto',
        }}
        onClick={() => input.trigger('pause')}
      >
        II
      </button>
      <button
        style={{
          position: 'absolute',
          top: 'calc(var(--safe-top, 0px) + 52px)',
          right: 'var(--safe-right, 0px)',
          minHeight: 44,
          minWidth: 44,
          pointerEvents: 'auto',
        }}
        onClick={() => input.trigger('missions')}
      >
        M
      </button>
    </div>
  );
}
