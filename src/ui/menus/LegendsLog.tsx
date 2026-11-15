// OWNER: UI/UX
// Stub (Architecture). Visibile con panel 'legends'. Ogni voce: titolo, descrizione, icona (nome
// lucide-react in story.icon), stato scoperta/non scoperta ("?"), punti. Dati: content.storyOrder/stories.
import { content } from '@/data';
import { useGameStore } from '@/store/gameStore';

export function LegendsLog() {
  const panel = useGameStore((s) => s.panel);
  const unlocked = useGameStore((s) => s.progress.unlockedStories);
  const closePanel = useGameStore((s) => s.closePanel);
  if (panel !== 'legends') return null;
  return (
    <div role="dialog" aria-label="Registro delle leggende" style={{ pointerEvents: 'auto' }}>
      <h2>REGISTRO DELLE LEGGENDE</h2>
      <ul>
        {content.storyOrder.map((id) => {
          const s = content.stories[id];
          if (!s) return null;
          const known = unlocked.includes(id);
          return <li key={id}>{known ? `${s.title} - ${s.description} (${s.points} pt)` : '?'}</li>;
        })}
      </ul>
      <button onClick={closePanel}>CHIUDI</button>
    </div>
  );
}
