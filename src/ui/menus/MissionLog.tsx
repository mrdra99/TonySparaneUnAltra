// OWNER: UI/UX
// Registro missioni (tasto M / menu di pausa): stato, obiettivi e ricompense di ogni missione.
import { CircleCheck, Circle, Lock } from 'lucide-react';
import { content } from '@/data';
import { listMissions } from '@/game/quests/selectors';
import { useGameStore } from '@/store/gameStore';
import { Button } from '../shared/Button';
import { Sheet } from '../shared/Sheet';
import styles from './Logs.module.css';

const STATUS_LABEL = {
  locked: 'DA SCOPRIRE',
  active: 'IN CORSO',
  completed: 'COMPLETATA',
} as const;

export function MissionLog() {
  const panel = useGameStore((s) => s.panel);
  const progress = useGameStore((s) => s.progress);
  const closePanel = useGameStore((s) => s.closePanel);
  if (panel !== 'missions') return null;

  const missions = listMissions(progress, content);

  return (
    <Sheet
      title="Missioni"
      onClose={closePanel}
      size="wide"
      footer={<Button onClick={closePanel}>Chiudi</Button>}
    >
      <ul className={styles.list}>
        {missions.map((m) => {
          const locked = m.status === 'locked';
          const done = progress.missions[m.mission.id]?.completedObjectives ?? [];
          const reward = m.mission.reward;
          const achievement = reward.achievementId
            ? content.achievements[reward.achievementId]
            : undefined;
          const story = reward.storyId ? content.stories[reward.storyId] : undefined;
          return (
            <li
              key={m.mission.id}
              className={`${styles.card} ${styles[m.status]}`}
              aria-label={locked ? 'Missione da scoprire' : m.mission.title}
            >
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>{locked ? '???' : m.mission.title}</h3>
                <span className={`${styles.stamp} ${styles[`stamp_${m.status}`]}`}>
                  {STATUS_LABEL[m.status]}
                </span>
              </div>
              {locked ? (
                <p className={styles.muted}>
                  <Lock size={14} aria-hidden="true" /> Parla con la gente della piazza per
                  scoprirla.
                </p>
              ) : (
                <>
                  {m.mission.tagline && <p className={styles.tagline}>{m.mission.tagline}</p>}
                  <p className={styles.desc}>{m.mission.description}</p>
                  <ul className={styles.objectives}>
                    {m.mission.objectives.map((o) => {
                      const ok = done.includes(o.id);
                      return (
                        <li key={o.id} className={ok ? styles.ok : ''}>
                          {ok ? (
                            <CircleCheck size={18} strokeWidth={2.8} aria-label="Fatto" />
                          ) : (
                            <Circle size={18} strokeWidth={2.8} aria-label="Da fare" />
                          )}
                          <span>{o.description}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className={styles.reward}>
                    <strong>Ricompensa:</strong> +{reward.cazzate} Cazzatometro
                    {reward.points ? `, ${reward.points} punti` : ''}
                    {achievement ? `, achievement «${achievement.title}»` : ''}
                    {story ? `, leggenda «${story.title}»` : ''}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
