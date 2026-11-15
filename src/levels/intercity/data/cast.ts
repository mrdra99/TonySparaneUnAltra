// OWNER: Finale. Personaggi e interagibili delle tappe del flashback (dati puri, niente React/three).
import type { Condition, InteractableDefinition, NpcAppearance, Vec2 } from '@/game/core/types';
import { FLAGS, type FlashbackLevelId } from '../logic/ids';

/** Rotazione Y (convenzione CONTRACTS) di chi sta in `from` e guarda verso `to`. */
export const facing = (from: Vec2, to: Vec2): number =>
  Math.atan2(to[0] - from[0], to[1] - from[1]);

export interface FinaleCharacter {
  id: string;
  name: string;
  level: FlashbackLevelId;
  position: Vec2;
  rotationY: number;
  pose: 'stand' | 'sit' | 'lean';
  /** Se true l'NPC gira la testa verso Tony (attenzione). */
  watchesTony: boolean;
  appearance: NpcAppearance;
  /** `null` = nessun dialogo (solo scenografia). */
  dialogueId: string | null;
}

/** Aspetto di riserva di Bogdan: il gioco usa quello dell'NPC `bogdan` se esiste (stesso volto). */
export const BOGDAN_FALLBACK_APPEARANCE: NpcAppearance = {
  skin: '#e8b88e',
  shirt: '#2f3a48',
  pants: '#1f2430',
  hair: '#b8923a',
  hairStyle: 'short',
  height: 1.86,
  build: 'broad',
  accessory: 'glasses',
};

const BOGDAN_PISA: Vec2 = [-11, 3];
const BOGDAN_VGO: Vec2 = [4.6, 1.6];
const BOGDAN_TORRE: Vec2 = [5.8, -6.1];

export const FINALE_CHARACTERS: readonly FinaleCharacter[] = [
  {
    id: 'bogdan-pisa',
    name: 'Bogdan',
    level: 'intercity-pisa',
    position: BOGDAN_PISA,
    rotationY: facing(BOGDAN_PISA, [13, 4.5]),
    pose: 'stand',
    watchesTony: true,
    appearance: BOGDAN_FALLBACK_APPEARANCE,
    dialogueId: 'finale-pisa-bogdan',
  },
  {
    id: 'nico',
    name: 'Nico',
    level: 'intercity-viareggio',
    position: [-3.5, -1.2],
    rotationY: facing([-3.5, -1.2], [-10, 5]),
    pose: 'stand',
    watchesTony: true,
    appearance: {
      skin: '#d9a98a',
      shirt: '#e0853a',
      pants: '#34384a',
      hair: '#2b1f1a',
      hairStyle: 'curly',
      height: 1.76,
    },
    dialogueId: 'finale-nico',
  },
  {
    id: 'vale',
    name: 'Vale',
    level: 'intercity-viareggio',
    position: [0.6, 3.4],
    rotationY: facing([0.6, 3.4], [-10, 5]),
    pose: 'stand',
    watchesTony: false,
    appearance: {
      skin: '#f0cdb0',
      shirt: '#5a8f6a',
      pants: '#2e2e3a',
      hair: '#3b2418',
      hairStyle: 'long',
      height: 1.67,
      build: 'slim',
    },
    dialogueId: 'finale-vale',
  },
  {
    id: 'ricky',
    name: 'Ricky',
    level: 'intercity-viareggio',
    position: [-1.4, -5.2],
    rotationY: facing([-1.4, -5.2], [-10, 5]),
    pose: 'lean',
    watchesTony: true,
    appearance: {
      skin: '#e3b894',
      shirt: '#3d5c9a',
      pants: '#4a4338',
      hair: '#40342a',
      hairStyle: 'cap',
      height: 1.8,
      accessory: 'cap',
    },
    dialogueId: 'finale-ricky',
  },
  {
    id: 'bogdan-viareggio',
    name: 'Bogdan',
    level: 'intercity-viareggio',
    position: BOGDAN_VGO,
    rotationY: facing(BOGDAN_VGO, [-10, 5]),
    pose: 'stand',
    watchesTony: true,
    appearance: BOGDAN_FALLBACK_APPEARANCE,
    dialogueId: 'finale-viareggio-bogdan',
  },
  {
    id: 'bogdan-torre',
    name: 'Bogdan',
    level: 'intercity-torre',
    position: BOGDAN_TORRE,
    rotationY: facing(BOGDAN_TORRE, [-13, 9]),
    pose: 'stand',
    watchesTony: true,
    appearance: BOGDAN_FALLBACK_APPEARANCE,
    dialogueId: 'finale-torre-bogdan',
  },
];

export const characterById = (id: string): FinaleCharacter | undefined =>
  FINALE_CHARACTERS.find((c) => c.id === id);

// --- Interagibili -----------------------------------------------------------------------------

export interface LevelInteractable {
  level: FlashbackLevelId;
  def: InteractableDefinition;
  /** Se presente l'interagibile e' attivo solo quando tutte le condizioni sono vere. */
  unlockedWhen?: readonly Condition[];
}

const talk = (c: FinaleCharacter): LevelInteractable => ({
  level: c.level,
  def: {
    id: `finale:${c.id}`,
    position: c.position,
    radius: 2.4,
    label: `PARLA CON ${c.name.toUpperCase()}`,
    action: { type: 'dialogue', dialogueId: c.dialogueId ?? '' },
  },
});

export const PISA_DOOR_POS: Vec2 = [7, -2.1];
export const PISA_VENDING_POS: Vec2 = [-4, 7.4];
export const TAXI_DOOR_POS: Vec2 = [8, -0.2];

export const LEVEL_INTERACTABLES: readonly LevelInteractable[] = [
  ...FINALE_CHARACTERS.filter((c) => c.dialogueId !== null).map(talk),
  {
    level: 'intercity-pisa',
    def: {
      id: 'finale:pisa-door',
      position: PISA_DOOR_POS,
      radius: 2.3,
      label: 'SALI SULL’INTERCITY',
      action: { type: 'dialogue', dialogueId: 'finale-pisa-door' },
      disabledLabel: 'Prima i 40 € di Bogdan',
      priority: 2,
    },
    unlockedWhen: [{ type: 'flag', flag: FLAGS.loan }],
  },
  {
    level: 'intercity-pisa',
    def: {
      id: 'finale:pisa-vending',
      position: PISA_VENDING_POS,
      radius: 1.7,
      label: 'GUARDA IL DISTRIBUTORE',
      action: { type: 'dialogue', dialogueId: 'finale-pisa-vending' },
    },
  },
  {
    level: 'intercity-viareggio',
    def: {
      id: 'finale:taxi-door',
      position: TAXI_DOOR_POS,
      radius: 2.3,
      label: 'SALI SUL TAXI',
      action: { type: 'dialogue', dialogueId: 'finale-taxi-door' },
      disabledLabel: 'La colletta non è finita',
      priority: 2,
    },
    unlockedWhen: [{ type: 'flag', flag: FLAGS.colBogdan }],
  },
];

export const interactablesFor = (level: FlashbackLevelId): readonly LevelInteractable[] =>
  LEVEL_INTERACTABLES.filter((i) => i.level === level);
