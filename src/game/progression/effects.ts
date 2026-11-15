/**
 * OWNER: Architecture.
 * applyEffect / applyEffects: funzioni PURE (progress, effect, content) -> {progress, events}.
 * - non mutano l'input; se nulla cambia restituiscono la STESSA referenza di progress
 * - Cazzatometro clampato a 0..100, soglie 25/50/75/100 con messaggi esatti
 * - una missione si completa automaticamente quando tutti gli obiettivi sono completati,
 *   e assegna il premio (Cazzatometro, punti, achievement, storia)
 * Effetti con id sconosciuti vengono ignorati (la validazione dei dati e' in validateContent).
 */
import type { DialogueEffect, GameContent, MissionReward, PlayerProgress } from '@/game/core/types';
import {
  CAZZATOMETRO_MAX,
  THRESHOLD_MESSAGES,
  clampCazzate,
  thresholdsCrossed,
} from './cazzatometro';
import type { GameEvent } from './events';

export interface EffectResult {
  progress: PlayerProgress;
  events: GameEvent[];
}

const NOOP = (progress: PlayerProgress): EffectResult => ({ progress, events: [] });

function addToList(list: readonly string[], value: string): readonly string[] {
  return list.includes(value) ? list : [...list, value];
}

function addCazzate(
  progress: PlayerProgress,
  amount: number,
  reason: string,
  onceId: string | undefined,
): EffectResult {
  if (onceId && progress.claimedKeys.includes(onceId)) return NOOP(progress);
  const claimedKeys = onceId ? addToList(progress.claimedKeys, onceId) : progress.claimedKeys;
  const prev = progress.cazzate;
  const next = clampCazzate(prev + amount);
  const next2: PlayerProgress = { ...progress, cazzate: next, claimedKeys };
  const delta = next - prev;
  if (delta <= 0) {
    return claimedKeys === progress.claimedKeys && delta === 0
      ? NOOP(progress)
      : { progress: next2, events: [] };
  }
  const events: GameEvent[] = [{ type: 'cazzateIncreased', amount: delta, total: next, reason }];
  for (const threshold of thresholdsCrossed(prev, next)) {
    events.push({ type: 'thresholdReached', threshold, message: THRESHOLD_MESSAGES[threshold] });
    if (threshold === CAZZATOMETRO_MAX) events.push({ type: 'celebration', kind: 'finale' });
  }
  return { progress: next2, events };
}

function unlockStory(
  progress: PlayerProgress,
  storyId: string,
  content: GameContent,
): EffectResult {
  const story = content.stories[storyId];
  if (!story || progress.unlockedStories.includes(storyId)) return NOOP(progress);
  return {
    progress: {
      ...progress,
      unlockedStories: [...progress.unlockedStories, storyId],
      score: progress.score + story.points,
      stats: { ...progress.stats, storiesTold: progress.stats.storiesTold + 1 },
    },
    events: [{ type: 'storyUnlocked', storyId, points: story.points }],
  };
}

function unlockAchievement(
  progress: PlayerProgress,
  achievementId: string,
  content: GameContent,
): EffectResult {
  const ach = content.achievements[achievementId];
  if (!ach || progress.unlockedAchievements.includes(achievementId)) return NOOP(progress);
  return {
    progress: {
      ...progress,
      unlockedAchievements: [...progress.unlockedAchievements, achievementId],
      score: progress.score + ach.points,
    },
    events: [{ type: 'achievementUnlocked', achievementId, points: ach.points }],
  };
}

function startMission(
  progress: PlayerProgress,
  missionId: string,
  content: GameContent,
): EffectResult {
  if (!content.missions[missionId] || progress.missions[missionId]) return NOOP(progress);
  return {
    progress: {
      ...progress,
      missions: {
        ...progress.missions,
        [missionId]: { status: 'active', completedObjectives: [] },
      },
    },
    events: [{ type: 'missionStarted', missionId }],
  };
}

function awardMission(
  progress: PlayerProgress,
  missionId: string,
  reward: MissionReward,
  missionTitle: string,
  content: GameContent,
): EffectResult {
  let current: PlayerProgress = {
    ...progress,
    score: progress.score + (reward.points ?? 0),
  };
  const events: GameEvent[] = [{ type: 'missionCompleted', missionId, reward }];
  const chain: DialogueEffect[] = [];
  if (reward.cazzate > 0) {
    chain.push({ type: 'addCazzate', amount: reward.cazzate, reason: `Missione: ${missionTitle}` });
  }
  if (reward.achievementId)
    chain.push({ type: 'unlockAchievement', achievementId: reward.achievementId });
  if (reward.storyId) chain.push({ type: 'unlockStory', storyId: reward.storyId });
  for (const eff of chain) {
    const r = applyEffect(current, eff, content);
    current = r.progress;
    events.push(...r.events);
  }
  return { progress: current, events };
}

function completeObjective(
  progress: PlayerProgress,
  missionId: string,
  objectiveId: string,
  content: GameContent,
): EffectResult {
  const mission = content.missions[missionId];
  if (!mission || !mission.objectives.some((o) => o.id === objectiveId)) return NOOP(progress);
  const existing = progress.missions[missionId];
  if (existing?.status === 'completed') return NOOP(progress);
  if (existing?.completedObjectives.includes(objectiveId)) return NOOP(progress);

  const events: GameEvent[] = [];
  if (!existing) events.push({ type: 'missionStarted', missionId });
  const completedObjectives = [...(existing?.completedObjectives ?? []), objectiveId];
  const total = mission.objectives.length;
  const allDone = mission.objectives.every((o) => completedObjectives.includes(o.id));
  let current: PlayerProgress = {
    ...progress,
    missions: {
      ...progress.missions,
      [missionId]: { status: allDone ? 'completed' : 'active', completedObjectives },
    },
  };
  events.push({
    type: 'objectiveCompleted',
    missionId,
    objectiveId,
    completed: completedObjectives.length,
    total,
  });
  if (allDone) {
    const r = awardMission(current, missionId, mission.reward, mission.title, content);
    current = r.progress;
    events.push(...r.events);
  }
  return { progress: current, events };
}

export function applyEffect(
  progress: PlayerProgress,
  effect: DialogueEffect,
  content: GameContent,
): EffectResult {
  switch (effect.type) {
    case 'addCazzate':
      return addCazzate(progress, effect.amount, effect.reason, effect.onceId);
    case 'completeObjective':
      return completeObjective(progress, effect.missionId, effect.objectiveId, content);
    case 'unlockStory':
      return unlockStory(progress, effect.storyId, content);
    case 'unlockAchievement':
      return unlockAchievement(progress, effect.achievementId, content);
    case 'setFlag':
      return progress.flags.includes(effect.flag)
        ? NOOP(progress)
        : { progress: { ...progress, flags: [...progress.flags, effect.flag] }, events: [] };
    case 'startMission':
      return startMission(progress, effect.missionId, content);
    case 'triggerCelebration':
      return { progress, events: [{ type: 'celebration', kind: effect.kind }] };
  }
}

export function applyEffects(
  progress: PlayerProgress,
  effects: readonly DialogueEffect[],
  content: GameContent,
): EffectResult {
  let current = progress;
  const events: GameEvent[] = [];
  for (const effect of effects) {
    const r = applyEffect(current, effect, content);
    current = r.progress;
    events.push(...r.events);
  }
  return { progress: current, events };
}
