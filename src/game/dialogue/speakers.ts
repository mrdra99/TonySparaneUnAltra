/** OWNER: Architecture. Risoluzione pura del nome/ritratto di chi parla. */
import { SPEAKER_NARRATOR, SPEAKER_TONY, type GameContent } from '@/game/core/types';
import { ASSET_PATHS } from '@/data/assets';

export interface SpeakerInfo {
  id: string;
  name: string;
  portrait: string | null;
}

export function resolveSpeaker(speakerId: string, content: GameContent): SpeakerInfo {
  if (speakerId === SPEAKER_TONY) {
    return { id: speakerId, name: 'Tony', portrait: ASSET_PATHS.tonyPortrait };
  }
  if (speakerId === SPEAKER_NARRATOR) return { id: speakerId, name: '', portrait: null };
  const npc = content.npcs.find((n) => n.id === speakerId);
  return npc
    ? { id: speakerId, name: npc.name, portrait: npc.portrait ?? null }
    : { id: speakerId, name: speakerId, portrait: null };
}
