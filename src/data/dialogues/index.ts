// OWNER: Gameplay
// Aggregatore dei dialoghi (un file per missione/area). Per aggiungere un dialogo: file nuovo + riga qui.
import type { Dialogue } from '@/game/core/types';
import { M1_DIALOGUES } from './m1';

export const DIALOGUES: readonly Dialogue[] = [...M1_DIALOGUES];
