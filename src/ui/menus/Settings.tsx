// OWNER: UI/UX
// Stub (Architecture). Visibile con panel 'settings' (da menu principale o pausa).
// Controlla: volume, mute, reducedMotion, distanza camera, sensibilita', qualita' (auto|high|low) e
// il pulsante AZZERA PROGRESSI (resetProgress). Limiti slider: SETTINGS_LIMITS.
import { SETTINGS_LIMITS } from '@/game/core/settings';
import { useGameStore } from '@/store/gameStore';

export function Settings() {
  const panel = useGameStore((s) => s.panel);
  const settings = useGameStore((s) => s.settings);
  const update = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const closePanel = useGameStore((s) => s.closePanel);
  if (panel !== 'settings') return null;
  const L = SETTINGS_LIMITS;
  return (
    <div role="dialog" aria-label="Impostazioni" style={{ pointerEvents: 'auto' }}>
      <h2>IMPOSTAZIONI</h2>
      <label>
        Volume
        <input
          type="range"
          min={L.volume.min}
          max={L.volume.max}
          step={L.volume.step}
          value={settings.volume}
          onChange={(e) => update({ volume: Number(e.target.value) })}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.muted}
          onChange={(e) => update({ muted: e.target.checked })}
        />{' '}
        Muto
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(e) => update({ reducedMotion: e.target.checked })}
        />{' '}
        Riduci animazioni
      </label>
      <label>
        Distanza camera
        <input
          type="range"
          min={L.cameraDistance.min}
          max={L.cameraDistance.max}
          step={L.cameraDistance.step}
          value={settings.cameraDistance}
          onChange={(e) => update({ cameraDistance: Number(e.target.value) })}
        />
      </label>
      <label>
        Sensibilita&apos;
        <input
          type="range"
          min={L.mouseSensitivity.min}
          max={L.mouseSensitivity.max}
          step={L.mouseSensitivity.step}
          value={settings.mouseSensitivity}
          onChange={(e) => update({ mouseSensitivity: Number(e.target.value) })}
        />
      </label>
      <label>
        Qualita&apos;
        <select
          value={settings.quality}
          onChange={(e) =>
            update({
              quality:
                e.target.value === 'high' ? 'high' : e.target.value === 'low' ? 'low' : 'auto',
            })
          }
        >
          <option value="auto">Automatica</option>
          <option value="high">Alta</option>
          <option value="low">Bassa</option>
        </select>
      </label>
      <button onClick={resetProgress}>AZZERA PROGRESSI</button>
      <button onClick={closePanel}>CHIUDI</button>
    </div>
  );
}
