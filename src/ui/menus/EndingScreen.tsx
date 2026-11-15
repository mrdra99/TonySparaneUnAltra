// OWNER: UI/UX
// Finale (fase 'ending'): durante la celebrazione 3D esplosione di fumetti e coriandoli; quando
// `endingRevealed` e' true compare la scheda con punteggio e statistiche (RICOMINCIA / TORNA AL MENU).
import { useMemo } from 'react';
import { Home, RotateCcw } from 'lucide-react';
import { content } from '@/data';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import type { PlayerProgress } from '@/game/core/types';
import { FINALE_KO_FLAG } from '@/game/progression/cazzatometro';
import { useGameStore } from '@/store/gameStore';
import { Button } from '../shared/Button';
import { useReducedMotion } from '../shared/useReducedMotion';
import styles from './EndingScreen.module.css';

const BURSTS: readonly { text: string; x: number; y: number; rot: number; delay: number }[] = [
  { text: 'SBAM!', x: 16, y: 26, rot: -12, delay: 0 },
  { text: 'MA DAI!', x: 80, y: 22, rot: 9, delay: 0.25 },
  { text: 'FRAAA!', x: 50, y: 14, rot: -4, delay: 0.5 },
  { text: 'OH FRA!', x: 12, y: 66, rot: 8, delay: 0.75 },
  { text: 'BOOM!', x: 86, y: 62, rot: -9, delay: 1 },
  { text: 'NO VABBÈ!', x: 50, y: 80, rot: 5, delay: 1.25 },
];

const CONFETTI_COLORS = ['#f08a24', '#f2c230', '#1f8a8a', '#f4ead5', '#c93a2b', '#16213e'];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  color: string;
  round: boolean;
}

/** Coriandoli deterministici (generatore LCG): stessa sequenza a ogni render. */
export function makeConfetti(count: number): Piece[] {
  let seed = 20240607;
  const rnd = (): number => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: rnd() * 100,
    delay: rnd() * 3.5,
    duration: 3.2 + rnd() * 2.6,
    drift: (rnd() - 0.5) * 220,
    size: 7 + rnd() * 8,
    color: CONFETTI_COLORS[Math.floor(rnd() * CONFETTI_COLORS.length)] ?? '#f2c230',
    round: rnd() > 0.65,
  }));
}

export interface EndingStats {
  missionsDone: number;
  missionsTotal: number;
  storiesUnlocked: number;
  storiesTotal: number;
  achievements: number;
  achievementsTotal: number;
  dialogues: number;
  choices: number;
  storiesTold: number;
  /** Durata in secondi, se nota. */
  seconds: number | null;
}

export function computeEndingStats(progress: PlayerProgress): EndingStats {
  const { startedAt, finishedAt } = progress.stats;
  return {
    missionsDone: content.missionOrder.filter((id) => progress.missions[id]?.status === 'completed')
      .length,
    missionsTotal: content.missionOrder.length,
    storiesUnlocked: progress.unlockedStories.length,
    storiesTotal: content.storyOrder.length,
    achievements: progress.unlockedAchievements.length,
    achievementsTotal: content.achievementOrder.length,
    dialogues: progress.stats.dialoguesStarted,
    choices: progress.stats.choicesMade,
    storiesTold: progress.stats.storiesTold,
    seconds:
      startedAt !== null && finishedAt !== null
        ? Math.max(0, Math.round((finishedAt - startedAt) / 1000))
        : null,
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Confetti({ count }: { count: number }) {
  const pieces = useMemo(() => makeConfetti(count), [count]);
  return (
    <div className={styles.confetti} aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`${styles.piece} ${p.round ? styles.round : ''}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.55,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export function EndingScreen() {
  const phase = useGameStore((s) => s.phase);
  const revealed = useGameStore((s) => s.endingRevealed);
  const celebration = useGameStore((s) => s.celebration);
  const progress = useGameStore((s) => s.progress);
  const restart = useGameStore((s) => s.restart);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const reduced = useReducedMotion();
  const { preset } = useDeviceProfile();
  if (phase !== 'ending') return null;

  const confettiCount = reduced ? 0 : Math.round(70 * preset.particleScale);
  const stats = computeEndingStats(progress);

  return (
    <div className={styles.root}>
      {confettiCount > 0 && <Confetti count={confettiCount} />}

      {!revealed && (
        <div key={celebration?.nonce ?? 0} className={styles.bursts} aria-hidden="true">
          {BURSTS.map((b) => (
            <span
              key={b.text}
              className={styles.burst}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                animationDelay: `${reduced ? 0 : b.delay}s`,
                ['--rot' as string]: `${b.rot}deg`,
              }}
            >
              <span className={styles.burstText}>{b.text}</span>
            </span>
          ))}
        </div>
      )}

      {revealed && (
        <section className={styles.card} role="dialog" aria-modal="true" aria-label="Fine demo">
          <h1 className={styles.title}>TONY NE HA SPARATA UN&apos;ALTRA!</h1>
          <p className={styles.sub}>Il Cazzatometro ha toccato quota 100.</p>
          {progress.flags.includes(FINALE_KO_FLAG) && (
            <p className={styles.debt}>
              Debito totale con Bogdan: 40 € + taxi + una ninna kanna mai ricevuta.
            </p>
          )}
          <p className={styles.scoreLabel}>PUNTEGGIO</p>
          <p className={styles.score}>{progress.score}</p>
          <dl className={styles.stats}>
            <div>
              <dt>Missioni</dt>
              <dd>
                {stats.missionsDone}/{stats.missionsTotal}
              </dd>
            </div>
            <div>
              <dt>Leggende</dt>
              <dd>
                {stats.storiesUnlocked}/{stats.storiesTotal}
              </dd>
            </div>
            <div>
              <dt>Achievement</dt>
              <dd>
                {stats.achievements}/{stats.achievementsTotal}
              </dd>
            </div>
            <div>
              <dt>Chiacchiere</dt>
              <dd>{stats.dialogues}</dd>
            </div>
            <div>
              <dt>Risposte date</dt>
              <dd>{stats.choices}</dd>
            </div>
            <div>
              <dt>Frasi sparate</dt>
              <dd>{stats.storiesTold}</dd>
            </div>
            {stats.seconds !== null && (
              <div>
                <dt>Tempo</dt>
                <dd>{formatTime(stats.seconds)}</dd>
              </div>
            )}
          </dl>
          <div className={styles.actions}>
            <Button
              variant="primary"
              icon={<RotateCcw size={20} strokeWidth={3} />}
              onClick={restart}
              autoFocus
            >
              RICOMINCIA
            </Button>
            <Button icon={<Home size={20} strokeWidth={3} />} onClick={returnToMenu}>
              TORNA AL MENU
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
