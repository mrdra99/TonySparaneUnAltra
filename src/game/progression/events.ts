/** OWNER: Architecture. Eventi di gioco tipizzati prodotti da applyEffect (nessun bus globale). */
import type { CelebrationKind, MissionReward } from '@/game/core/types';
import type { Threshold } from './cazzatometro';

export type GameEvent =
  | { type: 'cazzateIncreased'; amount: number; total: number; reason: string }
  | { type: 'thresholdReached'; threshold: Threshold; message: string }
  | { type: 'missionStarted'; missionId: string }
  | {
      type: 'objectiveCompleted';
      missionId: string;
      objectiveId: string;
      completed: number;
      total: number;
    }
  | { type: 'missionCompleted'; missionId: string; reward: MissionReward }
  | { type: 'achievementUnlocked'; achievementId: string; points: number }
  | { type: 'storyUnlocked'; storyId: string; points: number }
  | { type: 'celebration'; kind: CelebrationKind };

export type GameEventType = GameEvent['type'];
