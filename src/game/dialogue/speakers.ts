/** OWNER: Architecture. Risoluzione pura del nome/ritratto di chi parla. */
import {
  SPEAKER_NARRATOR,
  SPEAKER_TONY,
  type GameContent,
  type NpcAppearance,
} from '@/game/core/types';
import { ASSET_PATHS } from '@/data/assets';
import { PLAYER_DISPLAY_NAME } from '@/game/core/constants';

export interface SpeakerInfo {
  id: string;
  name: string;
  portrait: string | null;
  /** Aspetto per il ritratto illustrato (NPC o speaker extra), se noto. */
  appearance?: NpcAppearance;
}

export function resolveSpeaker(speakerId: string, content: GameContent): SpeakerInfo {
  if (speakerId === SPEAKER_TONY) {
    return { id: speakerId, name: PLAYER_DISPLAY_NAME, portrait: ASSET_PATHS.tonyPortrait };
  }
  if (speakerId === SPEAKER_NARRATOR) return { id: speakerId, name: '', portrait: null };
  const npc = content.npcs.find((n) => n.id === speakerId);
  if (npc) {
    return {
      id: speakerId,
      name: npc.name,
      portrait: npc.portrait ?? null,
      appearance: npc.appearance,
    };
  }
  const extra = content.speakers?.find((s) => s.id === speakerId);
  if (extra) {
    return {
      id: speakerId,
      name: extra.name,
      portrait: extra.portrait ?? null,
      appearance: extra.appearance,
    };
  }
  return { id: speakerId, name: speakerId, portrait: null };
}
