/** OWNER: Architecture. Selettori puri per HUD e registro missioni. */
import type { GameContent, Mission, PlayerProgress } from '@/game/core/types';

export interface MissionSummary {
  mission: Mission;
  completed: number;
  total: number;
  /** Testo HUD: hudLabel oppure descrizione del prossimo obiettivo. */
  label: string;
  nextObjectiveId: string | null;
}

export function summarizeMission(mission: Mission, progress: PlayerProgress): MissionSummary {
  const done = progress.missions[mission.id]?.completedObjectives ?? [];
  const next = mission.objectives.find((o) => !done.includes(o.id));
  return {
    mission,
    completed: done.length,
    total: mission.objectives.length,
    label: mission.hudLabel ?? next?.description ?? mission.description,
    nextObjectiveId: next?.id ?? null,
  };
}

/** Missione mostrata nell'HUD: la prima (per `order`) con stato 'active'; altrimenti null. */
export function getCurrentMission(
  progress: PlayerProgress,
  content: GameContent,
): MissionSummary | null {
  for (const id of content.missionOrder) {
    const m = content.missions[id];
    if (m && progress.missions[id]?.status === 'active') return summarizeMission(m, progress);
  }
  return null;
}

/** Tutte le missioni con il loro stato per il registro missioni (ordinate). */
export function listMissions(
  progress: PlayerProgress,
  content: GameContent,
): (MissionSummary & { status: 'locked' | 'active' | 'completed' })[] {
  return content.missionOrder.flatMap((id) => {
    const m = content.missions[id];
    if (!m) return [];
    const status = progress.missions[id]?.status ?? 'locked';
    return [{ ...summarizeMission(m, progress), status }];
  });
}

export function areAllMissionsCompleted(progress: PlayerProgress, content: GameContent): boolean {
  return (
    content.missionOrder.length > 0 &&
    content.missionOrder.every((id) => progress.missions[id]?.status === 'completed')
  );
}
