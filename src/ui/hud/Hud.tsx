// OWNER: UI/UX
// Stub (Architecture). HUD non invasivo, visibile in fasi 'playing' | 'dialogue'.
//  - alto-sinistra: missione corrente + obiettivo (getCurrentMission)
//  - alto-destra: Cazzatometro (progress.cazzate / 100)
//  - basso: prompt di interazione (nearbyPrompt) e suggerimenti; su touch il prompt e' sul pulsante
//    di TouchControls. Tutorial contestuale da `tutorialStep` ('move'|'look'|'run'|'interact'|'done').
import { content } from '@/data';
import { CAZZATOMETRO_MAX } from '@/game/progression/cazzatometro';
import { getCurrentMission } from '@/game/quests/selectors';
import { useGameStore } from '@/store/gameStore';

export function Hud() {
  const phase = useGameStore((s) => s.phase);
  const progress = useGameStore((s) => s.progress);
  const prompt = useGameStore((s) => s.nearbyPrompt);
  const promptDisabled = useGameStore((s) => s.nearbyPromptDisabled);
  if (phase !== 'playing' && phase !== 'dialogue') return null;
  const mission = getCurrentMission(progress, content);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div
        style={{ position: 'absolute', top: 'var(--safe-top, 0px)', left: 'var(--safe-left, 0px)' }}
      >
        {mission && (
          <p>
            MISSIONE: {mission.mission.title}
            <br />
            {mission.label} - {mission.completed}/{mission.total}
          </p>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 'var(--safe-top, 0px)',
          right: 'var(--safe-right, 0px)',
        }}
      >
        <p>
          CAZZATOMETRO {Math.round(progress.cazzate)}/{CAZZATOMETRO_MAX}
        </p>
        <progress max={CAZZATOMETRO_MAX} value={progress.cazzate} />
      </div>
      {phase === 'playing' && prompt && (
        <p
          style={{
            position: 'absolute',
            bottom: 'calc(var(--safe-bottom, 0px) + 16px)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {promptDisabled ? prompt : `[E] ${prompt}`}
        </p>
      )}
    </div>
  );
}
