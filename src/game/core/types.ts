/**
 * OWNER: Architecture
 * Modelli di dominio condivisi da TUTTI i moduli. Nessun import da React/Three.
 * Convenzioni: coordinate in metri, Y verso l'alto; `Vec2` e' [x, z] sul piano del suolo.
 * rotationY: 0 = guarda verso +Z, cresce verso +X (stessa convenzione di Object3D.rotation.y).
 */

// ---------------------------------------------------------------------------
// Primitive geometriche
// ---------------------------------------------------------------------------

/** Posizione sul piano del suolo: [x, z]. */
export type Vec2 = readonly [x: number, z: number];
/** Posizione 3D: [x, y, z]. */
export type Vec3 = readonly [x: number, y: number, z: number];
/** Punto 2D mutabile (per codice senza allocazioni per frame). */
export interface MutableVec2 {
  x: number;
  z: number;
}

// ---------------------------------------------------------------------------
// Collisioni
// ---------------------------------------------------------------------------

export interface CircleCollider {
  kind: 'circle';
  x: number;
  z: number;
  r: number;
}

/** Box allineato agli assi (AABB). Per ostacoli ruotati usare piu' box/cerchi. */
export interface BoxCollider {
  kind: 'box';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Forma di collisione 2D sul piano XZ (stessa forma esportata da World come `ColliderShape`). */
export type ColliderShape = CircleCollider | BoxCollider;
export type Collider = ColliderShape;

// ---------------------------------------------------------------------------
// Personaggi
// ---------------------------------------------------------------------------

export type Gender = 'male' | 'female';
export type HairStyle = 'short' | 'long' | 'bald' | 'cap' | 'curly';

/** Aspetto procedurale di un personaggio (stessa forma usata da NpcModel di World). */
export interface NpcAppearance {
  /** Colori CSS (#rrggbb). */
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  hairStyle: HairStyle;
  /** Altezza in metri (adulto ~1.65-1.9). */
  height: number;
  build?: 'slim' | 'normal' | 'broad';
  accessory?: 'glasses' | 'cap' | 'scarf' | 'none';
}

export interface Character {
  id: string;
  name: string;
  appearance: NpcAppearance;
}

export type IdleBehaviour = 'stand' | 'lean' | 'phone' | 'chat' | 'sit' | 'wave' | 'pace';

export interface NpcDefinition extends Character {
  gender: Gender;
  /**
   * Se true l'NPC gira la testa verso Tony quando passa (meccanica "TUTTI GUARDANO TONY").
   * Convenzione dati: `watchesTony = gender === 'male'`, ma e' un flag esplicito (si puo' forzare).
   */
  watchesTony: boolean;
  /** Posizione iniziale [x, z]. */
  position: Vec2;
  /** Orientamento iniziale del busto (rad, convenzione rotationY). */
  rotationY: number;
  idleBehaviour: IdleBehaviour;
  /** Dialogo aperto dal prompt "PARLA CON ..." */
  dialogueId?: string;
  /** Missione a cui l'NPC e' associato (informativo; la logica passa dagli effetti del dialogo). */
  missionId?: string;
  /** Battute ambientali / reazioni al passaggio di Tony (es. "👀", "Ma questo non era in Russia?"). */
  ambientLines?: readonly string[];
  /** URL del ritratto per il pannello dialogo (opzionale: fallback con iniziali). */
  portrait?: string;
  /** Raggio entro cui l'NPC si accorge di Tony (default ATTENTION_DEFAULT_RADIUS). */
  attentionRadius?: number;
  /** Raggio del collider cerchio (default NPC_COLLIDER_RADIUS). */
  colliderRadius?: number;
}

// ---------------------------------------------------------------------------
// Effetti, condizioni, dialoghi
// ---------------------------------------------------------------------------

export type CelebrationKind = 'confetti' | 'comicBurst' | 'finale';

export type DialogueEffect =
  | {
      type: 'addCazzate';
      amount: number;
      reason: string;
      /** Se presente, l'effetto vale una sola volta per salvataggio (anti-farming). */
      onceId?: string;
    }
  | { type: 'completeObjective'; missionId: string; objectiveId: string }
  | { type: 'unlockStory'; storyId: string }
  | { type: 'unlockAchievement'; achievementId: string }
  | { type: 'setFlag'; flag: string }
  | { type: 'startMission'; missionId: string }
  | { type: 'triggerCelebration'; kind: CelebrationKind };

export type DialogueEffectType = DialogueEffect['type'];

/** Condizioni valutate dal motore dialoghi su PlayerProgress (tutte in AND). */
export type Condition =
  | { type: 'flag'; flag: string }
  | { type: 'notFlag'; flag: string }
  | { type: 'objectiveCompleted'; missionId: string; objectiveId: string }
  | { type: 'objectiveNotCompleted'; missionId: string; objectiveId: string }
  | { type: 'missionCompleted'; missionId: string }
  | { type: 'missionActive'; missionId: string }
  | { type: 'minCazzate'; value: number }
  | { type: 'dialogueCompleted'; dialogueId: string };

/** Speaker: 'tony' | 'narrator' | id di un NPC. */
export type SpeakerId = string;
export const SPEAKER_TONY = 'tony';
export const SPEAKER_NARRATOR = 'narrator';

export type DialogueMood = 'neutral' | 'happy' | 'angry' | 'smug' | 'confused' | 'shocked';

export interface DialogueChoice {
  text: string;
  /** Id del nodo successivo, oppure DIALOGUE_END ('$end'). */
  next: string;
  effects?: readonly DialogueEffect[];
  /** Scelta visibile solo se tutte le condizioni sono vere. */
  requires?: readonly Condition[];
}

export interface DialogueNode {
  id: string;
  speaker: SpeakerId;
  text: string;
  mood?: DialogueMood;
  /** Tony gesticola mentre racconta (anim 'gesture'). */
  gesture?: boolean;
  /** Scelte (2-3). Se presenti e almeno una visibile, il nodo e' uno stato 'choice'. */
  choices?: readonly DialogueChoice[];
  /** Nodo successivo se non ci sono scelte. Assente o DIALOGUE_END = fine dialogo. */
  next?: string;
  /** Effetti applicati all'ingresso nel nodo. */
  effects?: readonly DialogueEffect[];
  /** Se non soddisfatte, il nodo viene saltato verso `fallback` (o il dialogo termina). */
  requires?: readonly Condition[];
  fallback?: string;
}

export interface Dialogue {
  id: string;
  /** Id del nodo iniziale. */
  start: string;
  /**
   * Nodo iniziale alternativo usato se il dialogo e' gia' stato completato
   * (progress.completedDialogues). Cosi' i dialoghi si possono riaprire senza bloccare nulla.
   */
  repeatStart?: string;
  nodes: Readonly<Record<string, DialogueNode>>;
}

/** Valore speciale di `next` per terminare il dialogo. */
export const DIALOGUE_END = '$end';

// ---------------------------------------------------------------------------
// Missioni, achievement, storie
// ---------------------------------------------------------------------------

export interface MissionObjective {
  id: string;
  /** Testo HUD, es. "Parla con Marco". */
  description: string;
}

export interface MissionReward {
  /** Punti Cazzatometro (0-100 scala). */
  cazzate: number;
  /** Punti punteggio finale (opzionale, default 0). */
  points?: number;
  achievementId?: string;
  storyId?: string;
}

export interface Mission {
  id: string;
  /** Titolo maiuscolo HUD, es. "LA NINNA CANNA". */
  title: string;
  /** Sottotitolo/battuta, es. "Oh fraaaa...". */
  tagline?: string;
  description: string;
  /** Ordine di visualizzazione / di scelta della missione corrente. */
  order: number;
  objectives: readonly MissionObjective[];
  reward: MissionReward;
  /** Testo riassuntivo HUD (es. "Parla con gli amici della piazza"). Fallback: prossimo obiettivo. */
  hudLabel?: string;
  /** Avviata automaticamente a nuova partita. */
  autoStart?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Nome icona lucide-react come stringa (es. "Trophy"). */
  icon: string;
  points: number;
}

/** Voce del Registro delle leggende. */
export interface Story {
  id: string;
  title: string;
  description: string;
  /** Nome icona lucide-react come stringa (es. "Bike"). */
  icon: string;
  points: number;
}

/** Frase per "SPARANE UN'ALTRA". */
export interface RandomStory {
  id: string;
  text: string;
  /** Punti Cazzatometro la prima volta che esce (default RANDOM_STORY_DEFAULT_CAZZATE). */
  cazzate?: number;
}

// ---------------------------------------------------------------------------
// Interagibili
// ---------------------------------------------------------------------------

export type InteractionAction =
  | { type: 'dialogue'; dialogueId: string }
  | { type: 'randomStory' }
  | { type: 'collectible'; itemId: string; effects?: readonly DialogueEffect[] }
  | { type: 'mission'; missionId: string; objectiveId?: string };

export interface InteractableDefinition {
  id: string;
  /** Posizione [x, z]. */
  position: Vec2;
  /** Raggio di attivazione in metri. */
  radius: number;
  /** Etichetta senza "[E]", es. "PARLA CON MARCO" o "SPARANE UN'ALTRA". */
  label: string;
  action: InteractionAction;
  /** Default true. */
  enabled?: boolean;
  /** Etichetta mostrata se `enabled` e' false (feedback "non disponibile"), es. "NON ORA". */
  disabledLabel?: string;
  /** A parita' di distanza vince la priorita' piu' alta (default 0). */
  priority?: number;
}

// ---------------------------------------------------------------------------
// Progresso, impostazioni, salvataggio
// ---------------------------------------------------------------------------

export type MissionStatus = 'active' | 'completed';

export interface MissionProgress {
  status: MissionStatus;
  completedObjectives: readonly string[];
}

export interface ProgressStats {
  dialoguesStarted: number;
  choicesMade: number;
  storiesTold: number;
  /** Timestamp ms di inizio partita; null = partita mai iniziata. */
  startedAt: number | null;
  /** Timestamp ms in cui il Cazzatometro ha toccato 100. */
  finishedAt: number | null;
}

export interface PlayerProgress {
  /** Cazzatometro 0..100. */
  cazzate: number;
  /** Punteggio (somma punti storie, achievement e premi missione). */
  score: number;
  missions: Readonly<Record<string, MissionProgress>>;
  flags: readonly string[];
  unlockedStories: readonly string[];
  unlockedAchievements: readonly string[];
  completedDialogues: readonly string[];
  /** Chiavi `onceId` degli effetti one-shot gia' incassati. */
  claimedKeys: readonly string[];
  stats: ProgressStats;
}

export type QualityProfile = 'high' | 'low';
export type QualitySetting = 'auto' | QualityProfile;

export interface Settings {
  /** 0..1 */
  volume: number;
  muted: boolean;
  reducedMotion: boolean;
  /** Distanza camera in metri. */
  cameraDistance: number;
  /** Moltiplicatore sensibilita' look (mouse e touch). */
  mouseSensitivity: number;
  /** 'auto' = rilevata dal dispositivo (useDeviceProfile). */
  quality: QualitySetting;
  /** Il tutorial contestuale e' gia' stato completato almeno una volta. */
  tutorialSeen: boolean;
}

export interface GameSave {
  version: number;
  /** Timestamp ms dell'ultimo salvataggio. */
  savedAt: number;
  progress: PlayerProgress;
  settings: Settings;
}

// ---------------------------------------------------------------------------
// Contenuti (catalogo indicizzato prodotto da createContent)
// ---------------------------------------------------------------------------

/** Chi parla in un dialogo senza essere un NPC della piazza (nome e aspetto nel pannello). */
export interface SpeakerDefinition {
  /** Valore usato in `DialogueNode.speaker`. */
  id: string;
  name: string;
  portrait?: string;
  appearance?: NpcAppearance;
}

export interface GameContent {
  missions: Readonly<Record<string, Mission>>;
  /** Id missioni ordinati per `order`. */
  missionOrder: readonly string[];
  achievements: Readonly<Record<string, Achievement>>;
  stories: Readonly<Record<string, Story>>;
  /** Id storie nell'ordine di definizione (ordine del Registro). */
  storyOrder: readonly string[];
  achievementOrder: readonly string[];
  dialogues: Readonly<Record<string, Dialogue>>;
  npcs: readonly NpcDefinition[];
  /** Interagibili NON-NPC (gli NPC generano il proprio da `npcs`). */
  interactables: readonly InteractableDefinition[];
  randomStories: readonly RandomStory[];
  /** Speaker extra (non NPC della piazza), es. i personaggi del livello finale. */
  speakers?: readonly SpeakerDefinition[];
}
