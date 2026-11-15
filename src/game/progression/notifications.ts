/**
 * OWNER: Architecture.
 * Conversione PURA GameEvent -> notifica (toast) e GameEvent -> effetto sonoro.
 * Lo store accoda le notifiche; UI/UX le renderizza (Notifications.tsx).
 */
import type { SfxName } from '@/audio/sfx';
import type { GameContent } from '@/game/core/types';
import type { GameEvent } from './events';

export type NotificationKind =
  | 'cazzate'
  | 'threshold'
  | 'missionStarted'
  | 'objective'
  | 'mission'
  | 'achievement'
  | 'story'
  | 'hint'
  | 'info';

export interface GameNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** Nome icona lucide-react (stringa). */
  icon?: string;
  /** Punti guadagnati da mostrare (punteggio o Cazzatometro, a seconda del kind). */
  points?: number;
  durationMs: number;
}

export type NotificationDraft = Omit<GameNotification, 'id'>;

export function eventToNotification(
  event: GameEvent,
  content: GameContent,
): NotificationDraft | null {
  switch (event.type) {
    case 'cazzateIncreased':
      return {
        kind: 'cazzate',
        title: `+${event.amount} CAZZATOMETRO`,
        body: event.reason,
        icon: 'Gauge',
        points: event.amount,
        durationMs: 2600,
      };
    case 'thresholdReached':
      return {
        kind: 'threshold',
        title: event.message,
        body: `Cazzatometro al ${event.threshold}%`,
        icon: 'Flame',
        durationMs: 4200,
      };
    case 'missionStarted': {
      const m = content.missions[event.missionId];
      return m
        ? {
            kind: 'missionStarted',
            title: 'NUOVA MISSIONE',
            body: m.title,
            icon: 'Flag',
            durationMs: 3500,
          }
        : null;
    }
    case 'objectiveCompleted': {
      const m = content.missions[event.missionId];
      const o = m?.objectives.find((x) => x.id === event.objectiveId);
      return {
        kind: 'objective',
        title: `${event.completed}/${event.total} ${o ? o.description : 'Obiettivo completato'}`,
        body: m?.title,
        icon: 'CheckCircle2',
        durationMs: 2800,
      };
    }
    case 'missionCompleted': {
      const m = content.missions[event.missionId];
      return {
        kind: 'mission',
        title: 'MISSIONE COMPLETATA',
        body: m ? m.title : event.missionId,
        icon: 'Trophy',
        points: event.reward.cazzate,
        durationMs: 5000,
      };
    }
    case 'achievementUnlocked': {
      const a = content.achievements[event.achievementId];
      return {
        kind: 'achievement',
        title: 'ACHIEVEMENT SBLOCCATO',
        body: a ? `${a.title} - ${a.description}` : event.achievementId,
        icon: a?.icon ?? 'Award',
        points: event.points,
        durationMs: 5000,
      };
    }
    case 'storyUnlocked': {
      const s = content.stories[event.storyId];
      return {
        kind: 'story',
        title: 'NUOVA LEGGENDA',
        body: s ? s.title : event.storyId,
        icon: s?.icon ?? 'ScrollText',
        points: event.points,
        durationMs: 4200,
      };
    }
    case 'celebration':
      return null;
  }
}

export function eventToSfx(event: GameEvent): SfxName | null {
  switch (event.type) {
    case 'cazzateIncreased':
      return 'cazzateUp';
    case 'missionCompleted':
      return 'missionComplete';
    case 'achievementUnlocked':
      return 'achievement';
    case 'celebration':
      return event.kind === 'finale' ? 'finale' : null;
    case 'objectiveCompleted':
    case 'storyUnlocked':
      return 'blip';
    default:
      return null;
  }
}
