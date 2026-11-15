/**
 * OWNER: Architecture. Costruzione e validazione del catalogo contenuti (puro).
 * I dati (src/data/**) forniscono array; createContent li indicizza, validateContent verifica
 * i riferimenti incrociati (un test in src/data/content.test.ts richiede che non ci siano problemi).
 */
import { validateDialogue } from '@/game/dialogue/engine';
import type {
  Achievement,
  Condition,
  Dialogue,
  DialogueEffect,
  GameContent,
  InteractableDefinition,
  Mission,
  NpcDefinition,
  RandomStory,
  Story,
} from './types';

export interface ContentInput {
  missions: readonly Mission[];
  dialogues: readonly Dialogue[];
  stories: readonly Story[];
  achievements: readonly Achievement[];
  npcs: readonly NpcDefinition[];
  interactables: readonly InteractableDefinition[];
  randomStories: readonly RandomStory[];
}

function indexById<T extends { id: string }>(
  items: readonly T[],
  label: string,
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const item of items) {
    if (item.id in out) throw new Error(`Contenuto duplicato (${label}): '${item.id}'`);
    out[item.id] = item;
  }
  return out;
}

export function createContent(input: ContentInput): GameContent {
  indexById(input.npcs, 'npc');
  indexById(input.interactables, 'interactable');
  indexById(input.randomStories, 'randomStory');
  return {
    missions: indexById(input.missions, 'mission'),
    missionOrder: [...input.missions].sort((a, b) => a.order - b.order).map((m) => m.id),
    achievements: indexById(input.achievements, 'achievement'),
    achievementOrder: input.achievements.map((a) => a.id),
    stories: indexById(input.stories, 'story'),
    storyOrder: input.stories.map((s) => s.id),
    dialogues: indexById(input.dialogues, 'dialogue'),
    npcs: input.npcs,
    interactables: input.interactables,
    randomStories: input.randomStories,
  };
}

/** Restituisce la lista dei problemi di coerenza dei dati (vuota = ok). */
export function validateContent(content: GameContent): string[] {
  const problems: string[] = [];

  const checkEffect = (where: string, e: DialogueEffect): void => {
    switch (e.type) {
      case 'completeObjective': {
        const m = content.missions[e.missionId];
        if (!m) problems.push(`${where}: missione '${e.missionId}' inesistente`);
        else if (!m.objectives.some((o) => o.id === e.objectiveId)) {
          problems.push(`${where}: obiettivo '${e.missionId}/${e.objectiveId}' inesistente`);
        }
        break;
      }
      case 'startMission':
        if (!content.missions[e.missionId])
          problems.push(`${where}: missione '${e.missionId}' inesistente`);
        break;
      case 'unlockStory':
        if (!content.stories[e.storyId])
          problems.push(`${where}: storia '${e.storyId}' inesistente`);
        break;
      case 'unlockAchievement':
        if (!content.achievements[e.achievementId]) {
          problems.push(`${where}: achievement '${e.achievementId}' inesistente`);
        }
        break;
      default:
        break;
    }
  };
  const checkCondition = (where: string, c: Condition): void => {
    if ('missionId' in c && !content.missions[c.missionId]) {
      problems.push(`${where}: condizione su missione '${c.missionId}' inesistente`);
    }
    if (c.type === 'dialogueCompleted' && !content.dialogues[c.dialogueId]) {
      problems.push(`${where}: condizione su dialogo '${c.dialogueId}' inesistente`);
    }
  };

  for (const d of Object.values(content.dialogues)) {
    problems.push(...validateDialogue(d));
    for (const [nodeId, node] of Object.entries(d.nodes)) {
      const where = `${d.id}/${nodeId}`;
      node.effects?.forEach((e) => checkEffect(where, e));
      node.requires?.forEach((c) => checkCondition(where, c));
      node.choices?.forEach((ch, i) => {
        ch.effects?.forEach((e) => checkEffect(`${where}#${i}`, e));
        ch.requires?.forEach((c) => checkCondition(`${where}#${i}`, c));
      });
    }
  }
  for (const m of Object.values(content.missions)) {
    if (m.objectives.length === 0) problems.push(`missione '${m.id}': nessun obiettivo`);
    if (m.reward.achievementId && !content.achievements[m.reward.achievementId]) {
      problems.push(`missione '${m.id}': achievement '${m.reward.achievementId}' inesistente`);
    }
    if (m.reward.storyId && !content.stories[m.reward.storyId]) {
      problems.push(`missione '${m.id}': storia '${m.reward.storyId}' inesistente`);
    }
  }
  for (const n of content.npcs) {
    if (n.dialogueId && !content.dialogues[n.dialogueId]) {
      problems.push(`npc '${n.id}': dialogo '${n.dialogueId}' inesistente`);
    }
    if (n.missionId && !content.missions[n.missionId]) {
      problems.push(`npc '${n.id}': missione '${n.missionId}' inesistente`);
    }
    if (n.watchesTony && n.gender !== 'male') {
      // non e' un errore, ma e' sospetto rispetto alla convenzione
      problems.push(`npc '${n.id}': watchesTony=true con gender='${n.gender}' (convenzione: male)`);
    }
  }
  for (const it of content.interactables) {
    const a = it.action;
    if (a.type === 'dialogue' && !content.dialogues[a.dialogueId]) {
      problems.push(`interactable '${it.id}': dialogo '${a.dialogueId}' inesistente`);
    }
    if (a.type === 'mission' && !content.missions[a.missionId]) {
      problems.push(`interactable '${it.id}': missione '${a.missionId}' inesistente`);
    }
    if (a.type === 'collectible')
      a.effects?.forEach((e) => checkEffect(`interactable '${it.id}'`, e));
  }
  return problems;
}
