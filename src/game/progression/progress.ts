/** OWNER: Architecture. Costruzione e query pure di PlayerProgress. */
import type { PlayerProgress } from '@/game/core/types';

export function createInitialProgress(startedAt: number | null = null): PlayerProgress {
  return {
    cazzate: 0,
    score: 0,
    missions: {},
    flags: [],
    unlockedStories: [],
    unlockedAchievements: [],
    completedDialogues: [],
    claimedKeys: [],
    stats: {
      dialoguesStarted: 0,
      choicesMade: 0,
      storiesTold: 0,
      startedAt,
      finishedAt: null,
    },
  };
}

export const hasFlag = (p: PlayerProgress, flag: string): boolean => p.flags.includes(flag);

export const isMissionCompleted = (p: PlayerProgress, missionId: string): boolean =>
  p.missions[missionId]?.status === 'completed';

export const isMissionActive = (p: PlayerProgress, missionId: string): boolean =>
  p.missions[missionId]?.status === 'active';

export const isObjectiveCompleted = (
  p: PlayerProgress,
  missionId: string,
  objectiveId: string,
): boolean => p.missions[missionId]?.completedObjectives.includes(objectiveId) ?? false;

export const isDialogueCompleted = (p: PlayerProgress, dialogueId: string): boolean =>
  p.completedDialogues.includes(dialogueId);

export const isStoryUnlocked = (p: PlayerProgress, storyId: string): boolean =>
  p.unlockedStories.includes(storyId);

export const isAchievementUnlocked = (p: PlayerProgress, achievementId: string): boolean =>
  p.unlockedAchievements.includes(achievementId);
