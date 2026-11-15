// OWNER: Finale. Ambiente + collider + interagibili + NPC della tappa corrente del flashback.
// Montato da GameCanvas al posto di <PiazzaLevel/> quando `level !== 'piazza'`.
import { FinaleNpc } from './actors/FinaleNpc';
import { FINALE_CHARACTERS } from './data/cast';
import { LevelInteractables } from './LevelInteractables';
import { PisaStation } from './env/PisaStation';
import { TorreNight } from './env/TorreNight';
import { ViareggioSquare } from './env/ViareggioSquare';
import type { FlashbackLevelId } from './logic/ids';

function Environment({ level, quality }: { level: FlashbackLevelId; quality: 'high' | 'low' }) {
  switch (level) {
    case 'intercity-pisa':
      return <PisaStation quality={quality} />;
    case 'intercity-viareggio':
      return <ViareggioSquare quality={quality} />;
    case 'intercity-torre':
      return <TorreNight quality={quality} />;
  }
}

export function FinaleLevel({
  level,
  quality,
}: {
  level: FlashbackLevelId;
  quality: 'high' | 'low';
}) {
  return (
    <>
      <Environment level={level} quality={quality} />
      <LevelInteractables level={level} />
      {FINALE_CHARACTERS.filter((c) => c.level === level).map((c) => (
        <FinaleNpc key={c.id} def={c} knockOut={c.id === 'bogdan-torre'} />
      ))}
    </>
  );
}
