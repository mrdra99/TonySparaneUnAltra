/** OWNER: Architecture. Costanti di gioco condivise (unita' = metri, secondi, radianti). */

// Player
export const PLAYER_DISPLAY_NAME = 'Fissshher Tonyo';
export const PLAYER_RADIUS = 0.4;
export const PLAYER_WALK_SPEED = 2.8;
export const PLAYER_RUN_SPEED = 5.6;
/** Fattore di smorzamento esponenziale della rotazione del personaggio (1/s). */
export const PLAYER_TURN_RATE = 10;
/** Il dt per frame va clampato a questo valore (evita tunneling dopo lag/tab in background). */
export const MAX_FRAME_DT = 1 / 20;

// Interazioni / NPC
export const DEFAULT_INTERACT_RADIUS = 2.2;
export const NPC_COLLIDER_RADIUS = 0.45;
export const ATTENTION_DEFAULT_RADIUS = 7;

// Input
export const LOOK_RADIANS_PER_PIXEL = 0.0025;

// Camera
export const CAMERA_LIMITS = {
  minDistance: 3,
  maxDistance: 10,
  defaultDistance: 6,
  minPitch: -0.15,
  maxPitch: 1.2,
  defaultPitch: 0.35,
  /** Altezza (m) del punto guardato sopra i piedi di Tony. */
  targetHeight: 1.4,
} as const;

// Fasi / timer di shell
export const INTRO_DURATION_MS = 2200;
export const ENDING_REVEAL_DELAY_MS = 3800;
export const MAX_NOTIFICATIONS = 8;

// Gameplay
export const RANDOM_STORY_DEFAULT_CAZZATE = 3;
export const RANDOM_STORY_HISTORY = 4;

/** Flag noti (setFlag). I dati possono definirne altri liberamente. */
export const GAME_FLAGS = {
  /** Attiva la gag animata della bicicletta (Bicycle.wobble). */
  bikeGag: 'gag.bike',
} as const;

/** Prefisso degli id dei dialoghi transitori (non finiscono in completedDialogues). */
export const TRANSIENT_DIALOGUE_PREFIX = 'random:';
