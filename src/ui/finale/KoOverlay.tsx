// OWNER: Finale. Scena del K.O. tecnico (solo overlay DOM; la caduta di Bogdan e' in 3D, FinaleNpc):
// campanella "DING DING DING", slow-motion con bande da cinema, conteggio dell'arbitro 1-2-3,
// grande scritta "K.O. TECNICO!" stile poster di boxe. Nessun colpo: e' esasperazione comica.
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { playSfx } from '@/audio/sfx';
import { koStageAt, type KoStage } from '@/levels/intercity/logic/ko';
import { useGameStore } from '@/store/gameStore';
import styles from './KoOverlay.module.css';

const TICK_MS = 80;

const COUNT_TEXT: Partial<Record<KoStage, string>> = { count1: '1…', count2: '2…', count3: '3…' };

function Run({ startedAt }: { startedAt: number }) {
  const [stage, setStage] = useState<KoStage>(() => koStageAt(Date.now() - startedAt));

  useEffect(() => {
    const id = window.setInterval(() => {
      setStage(koStageAt(Date.now() - startedAt));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (stage === 'bell' || stage === 'banner') playSfx('ringBell');
    else if (stage === 'count1' || stage === 'count2' || stage === 'count3') playSfx('menuSelect');
  }, [stage]);

  const count = COUNT_TEXT[stage];
  const cinematic = stage !== 'bell';
  return (
    <div className={styles.root} data-stage={stage} role="status" aria-live="assertive">
      <div className={styles.barTop} data-on={cinematic} aria-hidden="true" />
      <div className={styles.barBottom} data-on={cinematic} aria-hidden="true" />
      {stage === 'bell' && (
        <p className={styles.bell}>
          <Bell size={44} strokeWidth={3} aria-hidden="true" /> DING DING DING!
        </p>
      )}
      {stage === 'collapse' && <p className={styles.slow}>Bogdan non ce la fa più…</p>}
      {count && (
        <div className={styles.count}>
          <p className={styles.ref}>L&apos;ARBITRO CONTA</p>
          <p key={stage} className={styles.number}>
            {count}
          </p>
        </div>
      )}
      {(stage === 'banner' || stage === 'done') && (
        <div className={styles.banner}>
          <p className={styles.ko}>K.O. TECNICO!</p>
          <p className={styles.note}>Nessuno ha toccato nessuno: è solo pazienza esaurita.</p>
        </div>
      )}
    </div>
  );
}

export function KoOverlay() {
  const koAt = useGameStore((s) => s.finale.koStartedAt);
  const phase = useGameStore((s) => s.phase);
  if (koAt === null || phase !== 'dialogue') return null;
  return <Run key={koAt} startedAt={koAt} />;
}
