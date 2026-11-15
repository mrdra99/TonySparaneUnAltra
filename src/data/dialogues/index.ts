// OWNER: Gameplay
// Aggregatore dei dialoghi (un file per missione/area). Per aggiungere un dialogo: file nuovo + riga qui.
import type { Dialogue } from '@/game/core/types';
import { M1_DIALOGUES } from './m1';
import { M2_DIALOGUES } from './m2';
import { M3_DIALOGUES } from './m3';
import { M4_DIALOGUES } from './m4';
import { M5_DIALOGUES } from './m5';

export const DIALOGUES: readonly Dialogue[] = [
  ...M1_DIALOGUES,
  ...M2_DIALOGUES,
  ...M3_DIALOGUES,
  ...M4_DIALOGUES,
  ...M5_DIALOGUES,
];
