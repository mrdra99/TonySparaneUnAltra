// OWNER: UI/UX
// Stub (Architecture). Visibile con panel 'missions' (aperto da M o dal menu di pausa).
// Dati: listMissions(progress, content) da '@/game/quests/selectors'.
import { content } from '@/data';
import { listMissions } from '@/game/quests/selectors';
import { useGameStore } from '@/store/gameStore';

export function MissionLog() {
  const panel = useGameStore((s) => s.panel);
  const progress = useGameStore((s) => s.progress);
  const closePanel = useGameStore((s) => s.closePanel);
  if (panel !== 'missions') return null;
  return (
    <div role="dialog" aria-label="Registro missioni" style={{ pointerEvents: 'auto' }}>
      <h2>MISSIONI</h2>
      <ul>
        {listMissions(progress, content).map((m) => (
          <li key={m.mission.id}>
            {m.status === 'locked' ? '???' : m.mission.title} [{m.status}] {m.completed}/{m.total}
          </li>
        ))}
      </ul>
      <button onClick={closePanel}>CHIUDI</button>
    </div>
  );
}
