// OWNER: UI/UX
// Stub (Architecture). Visibile solo in fase 'loading'. L'avanzamento arriva da drei useProgress.
// Nota: viene montato FUORI dal Canvas (overlay HTML), useProgress funziona anche cosi'.
import { useProgress } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';

export function LoadingScreen() {
  const phase = useGameStore((s) => s.phase);
  const { progress } = useProgress();
  if (phase !== 'loading') return null;
  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#1b2a2f',
        color: '#fff',
        pointerEvents: 'auto',
      }}
    >
      <p>CARICAMENTO DELLA PIAZZETTA... {Math.round(progress)}%</p>
    </div>
  );
}
