// OWNER: Finale. Speaker dei dialoghi del livello finale che non sono NPC della piazza.
// `id` = valore di `DialogueNode.speaker` usato nei dialoghi (Bogdan e' gia' l'NPC `bogdan`).
import type { NpcAppearance, SpeakerDefinition } from '@/game/core/types';
import { characterById } from './cast';

const fromCast = (castId: string, speakerId: string): SpeakerDefinition => {
  const c = characterById(castId);
  if (!c) throw new Error(`Personaggio del finale inesistente: '${castId}'`);
  return { id: speakerId, name: c.name, appearance: c.appearance };
};

const TASSISTA_APPEARANCE: NpcAppearance = {
  skin: '#d6a37f',
  shirt: '#e8e2d0',
  pants: '#2a2f3a',
  hair: '#9a9a9a',
  hairStyle: 'short',
  height: 1.74,
  build: 'broad',
  accessory: 'glasses',
};

export const FINALE_SPEAKERS: readonly SpeakerDefinition[] = [
  fromCast('nico', 'Nico'),
  fromCast('vale', 'Vale'),
  fromCast('ricky', 'Ricky'),
  { id: 'Tassista', name: 'Tassista', appearance: TASSISTA_APPEARANCE },
];
