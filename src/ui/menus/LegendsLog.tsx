// OWNER: UI/UX
// Registro delle leggende: voci alimentate da `content` (stories + achievements). Le voci non ancora
// scoperte mostrano "???" e un punto interrogativo; quelle scoperte titolo, descrizione, icona, punti.
import { CircleHelp } from 'lucide-react';
import { content } from '@/data';
import { useGameStore } from '@/store/gameStore';
import { Button } from '../shared/Button';
import { Icon } from '../shared/icons';
import { Sheet } from '../shared/Sheet';
import styles from './Logs.module.css';

interface EntryProps {
  known: boolean;
  title: string;
  description: string;
  icon: string;
  points: number;
}

function Entry({ known, title, description, icon, points }: EntryProps) {
  return (
    <li className={`${styles.card} ${known ? styles.completed : styles.locked}`}>
      <div className={styles.entry}>
        <span className={styles.entryIcon} aria-hidden="true">
          {known ? <Icon name={icon} size={28} /> : <CircleHelp size={28} strokeWidth={2.8} />}
        </span>
        <div className={styles.entryText}>
          <h3 className={styles.cardTitle}>{known ? title : '???'}</h3>
          <p className={known ? styles.desc : styles.muted}>
            {known ? description : 'Leggenda non ancora scoperta.'}
          </p>
        </div>
        <span className={styles.points}>{known ? `+${points} pt` : '? pt'}</span>
      </div>
    </li>
  );
}

export function LegendsLog() {
  const panel = useGameStore((s) => s.panel);
  const unlockedStories = useGameStore((s) => s.progress.unlockedStories);
  const unlockedAchievements = useGameStore((s) => s.progress.unlockedAchievements);
  const closePanel = useGameStore((s) => s.closePanel);
  if (panel !== 'legends') return null;

  const stories = content.storyOrder.flatMap((id) => {
    const s = content.stories[id];
    return s ? [{ id, s, known: unlockedStories.includes(id) }] : [];
  });
  const achievements = content.achievementOrder.flatMap((id) => {
    const a = content.achievements[id];
    return a ? [{ id, a, known: unlockedAchievements.includes(id) }] : [];
  });

  return (
    <Sheet
      title="Registro delle leggende"
      onClose={closePanel}
      size="wide"
      footer={<Button onClick={closePanel}>Chiudi</Button>}
    >
      <p className={styles.counterLine}>
        Leggende scoperte:{' '}
        <strong>
          {stories.filter((x) => x.known).length}/{stories.length}
        </strong>
      </p>
      <ul className={styles.list} aria-label="Leggende">
        {stories.map(({ id, s, known }) => (
          <Entry
            key={id}
            known={known}
            title={s.title}
            description={s.description}
            icon={s.icon}
            points={s.points}
          />
        ))}
      </ul>
      {achievements.length > 0 && (
        <>
          <h3 className={styles.section}>Achievement</h3>
          <ul className={styles.list} aria-label="Achievement">
            {achievements.map(({ id, a, known }) => (
              <Entry
                key={id}
                known={known}
                title={a.title}
                description={a.description}
                icon={a.icon}
                points={a.points}
              />
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
