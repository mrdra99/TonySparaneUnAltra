/**
 * OWNER: Architecture.
 * Stato di RUNTIME per-frame: oggetto MUTABILE e NON reattivo.
 *
 * Regola d'oro: i dati che cambiano ogni frame vivono qui, MAI in zustand/React state.
 * I componenti R3F lo leggono dentro useFrame (`runtime.player.x` ...) e lo scrivono mutando i
 * campi. Chi vuole reagire a un cambiamento raro (es. interagibile piu' vicino) lo copia nello
 * store solo quando cambia (vedi gameStore.setNearbyPrompt).
 *
 * Scrittori (un solo scrittore per campo):
 *   player.x/y/z/rotationY/vx/vz/speed, anim.*  -> PlayerController (Gameplay)
 *   camera.yaw/pitch/distance                   -> ThirdPersonCamera (Gameplay)
 *   nearestInteractableId                       -> InteractionSystem (Gameplay)
 *   dialogue.*                                  -> gameStore (startDialogue/closeDialogue)
 *   resetPlayer()                               -> gameStore (newGame/returnToMenu)
 */
import type { Vec2 } from '@/game/core/types';

/** Stato di animazione di Tony. 'pose' = posa comica da menu (statica). */
export type TonyAnimState =
  'idle' | 'walk' | 'run' | 'talk' | 'gesture' | 'interact' | 'victory' | 'pose';

/** Sorgente di animazione MUTABILE letta da TonyModel in useFrame. */
export interface TonyAnimSource {
  state: TonyAnimState;
  /** Velocita' al suolo in m/s (per sincronizzare la camminata). */
  speed: number;
}

export type CameraMode = 'menu' | 'intro' | 'follow' | 'dialogue' | 'celebration';

export interface RuntimeState {
  player: {
    x: number;
    y: number;
    z: number;
    /** Rotazione del personaggio (rad, 0 = guarda +Z). */
    rotationY: number;
    vx: number;
    vz: number;
  };
  /** Letto da TonyModel: `<TonyModel anim={runtime.anim} />`. */
  anim: TonyAnimSource;
  camera: {
    /** Direzione di vista in orizzontale (rad, 0 = guarda +Z). Il movimento e' relativo a questo. */
    yaw: number;
    /** Inclinazione (rad, positivo = camera sopra Tony che guarda in basso). */
    pitch: number;
    /** Distanza corrente dalla camera a Tony (dopo smoothing/anti-occlusione). */
    distance: number;
  };
  /** Inquadratura dialogo: impostata dallo store all'apertura. */
  dialogue: {
    active: boolean;
    /** Punto d'interesse (es. NPC) sul piano del suolo. */
    targetX: number;
    targetZ: number;
    /** True se c'e' un interlocutore con posizione (altrimenti camera ravvicinata su Tony). */
    hasTarget: boolean;
  };
  /** Id dell'interagibile piu' vicino (anche disabilitato) o null. */
  nearestInteractableId: string | null;
}

export function createRuntime(): RuntimeState {
  return {
    player: { x: 0, y: 0, z: 0, rotationY: 0, vx: 0, vz: 0 },
    anim: { state: 'pose', speed: 0 },
    camera: { yaw: 0, pitch: 0.35, distance: 6 },
    dialogue: { active: false, targetX: 0, targetZ: 0, hasTarget: false },
    nearestInteractableId: null,
  };
}

export interface PlayerPose {
  position: Vec2;
  rotationY: number;
  anim: TonyAnimState;
  /** Yaw iniziale della camera (default: dietro le spalle del personaggio). */
  cameraYaw?: number;
}

/** Riposiziona Tony e azzera velocita'/dialogo/interagibile. */
export function resetPlayer(rt: RuntimeState, pose: PlayerPose): void {
  rt.player.x = pose.position[0];
  rt.player.y = 0;
  rt.player.z = pose.position[1];
  rt.player.rotationY = pose.rotationY;
  rt.player.vx = 0;
  rt.player.vz = 0;
  rt.anim.state = pose.anim;
  rt.anim.speed = 0;
  rt.camera.yaw = pose.cameraYaw ?? pose.rotationY;
  rt.dialogue.active = false;
  rt.dialogue.hasTarget = false;
  rt.nearestInteractableId = null;
}

/** Singleton usato dal gioco. */
export const runtime: RuntimeState = createRuntime();
