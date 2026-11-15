/**
 * OWNER: Architecture.
 * Input UNIFICATO e NON reattivo. Le sorgenti (tastiera, mouse, touch) SCRIVONO, i consumer
 * (PlayerController, camera, UI) LEGGONO: nessuno legge direttamente eventi DOM.
 *
 * Sorgenti -> API di scrittura:
 *   tastiera        -> attachKeyboard()  (setKey)
 *   mouse (desktop) -> attachMouseLook() (addLookDelta, pointer lock)
 *   joystick touch  -> input.setJoystick(x, y)   (y > 0 = avanti = joystick spinto verso l'alto)
 *   corsa touch     -> input.setTouchRun(bool)
 *   drag camera     -> input.addLookDelta(dx, dy) (pixel CSS)
 *   pulsanti touch  -> input.trigger('interact' | 'pause' | 'missions' | 'advance' | ...)
 *
 * Consumer -> API di lettura (zero allocazioni):
 *   input.moveAxis  {x: destra+, y: avanti+}, lunghezza <= 1 (analogico)
 *   input.run       boolean (shift, toggle touch, oppure joystick oltre AUTO_RUN_THRESHOLD)
 *   input.consumeLook(out)  restituisce e azzera il delta accumulato dall'ultimo consumo
 *   input.onAction(action, cb)  azioni "edge" (una volta per pressione)
 */
import { LOOK_RADIANS_PER_PIXEL } from './constants';

export { LOOK_RADIANS_PER_PIXEL };

export type InputAction =
  | 'interact' // E
  | 'advance' // Spazio
  | 'pause' // Esc
  | 'missions' // M
  | 'choice1' // 1
  | 'choice2' // 2
  | 'choice3'; // 3

export interface InputVec2 {
  x: number;
  y: number;
}

export const JOYSTICK_DEADZONE = 0.15;
/** Oltre questa intensita' il joystick fa correre automaticamente. */
export const AUTO_RUN_THRESHOLD = 0.85;

const KEY_FORWARD = ['KeyW', 'ArrowUp'];
const KEY_BACK = ['KeyS', 'ArrowDown'];
const KEY_LEFT = ['KeyA', 'ArrowLeft'];
const KEY_RIGHT = ['KeyD', 'ArrowRight'];
const KEY_RUN = ['ShiftLeft', 'ShiftRight'];

const KEY_ACTIONS: Readonly<Record<string, InputAction>> = {
  KeyE: 'interact',
  Space: 'advance',
  Escape: 'pause',
  KeyM: 'missions',
  Digit1: 'choice1',
  Digit2: 'choice2',
  Digit3: 'choice3',
  Numpad1: 'choice1',
  Numpad2: 'choice2',
  Numpad3: 'choice3',
};

const TRACKED_CODES = new Set<string>([
  ...KEY_FORWARD,
  ...KEY_BACK,
  ...KEY_LEFT,
  ...KEY_RIGHT,
  ...KEY_RUN,
  ...Object.keys(KEY_ACTIONS),
]);

type Listener = () => void;

export class InputManager {
  private readonly keys = new Set<string>();
  private readonly axis: InputVec2 = { x: 0, y: 0 };
  private joyX = 0;
  private joyY = 0;
  private touchRun = false;
  private lookX = 0;
  private lookY = 0;
  private runFlag = false;
  private readonly listeners: Record<InputAction, Set<Listener>> = {
    interact: new Set(),
    advance: new Set(),
    pause: new Set(),
    missions: new Set(),
    choice1: new Set(),
    choice2: new Set(),
    choice3: new Set(),
  };

  /** Asse di movimento corrente (oggetto riutilizzato: non conservarlo, leggilo ogni frame). */
  get moveAxis(): Readonly<InputVec2> {
    return this.axis;
  }

  get run(): boolean {
    return this.runFlag;
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  // --- scrittura: tastiera -------------------------------------------------

  /** Aggiorna lo stato di un tasto. Restituisce true se il tasto e' gestito dal gioco. */
  setKey(code: string, down: boolean, repeat = false): boolean {
    if (!TRACKED_CODES.has(code)) return false;
    if (down) {
      const wasDown = this.keys.has(code);
      this.keys.add(code);
      const action = KEY_ACTIONS[code];
      if (action && !wasDown && !repeat) this.trigger(action);
    } else {
      this.keys.delete(code);
    }
    this.recompute();
    return true;
  }

  // --- scrittura: touch / altre sorgenti ----------------------------------

  /** x: destra+, y: avanti+ (0..1 di raggio). Applica dead-zone e rimappa il resto su 0..1. */
  setJoystick(x: number, y: number): void {
    const mag = Math.hypot(x, y);
    if (mag < JOYSTICK_DEADZONE) {
      this.joyX = 0;
      this.joyY = 0;
    } else {
      const clamped = Math.min(mag, 1);
      const scaled = (clamped - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE);
      this.joyX = (x / mag) * scaled;
      this.joyY = (y / mag) * scaled;
    }
    this.recompute();
  }

  setTouchRun(on: boolean): void {
    this.touchRun = on;
    this.recompute();
  }

  /** Accumula uno spostamento "look" in pixel CSS (mouse o drag touch). */
  addLookDelta(dx: number, dy: number): void {
    this.lookX += dx;
    this.lookY += dy;
  }

  /** Copia in `out` il delta accumulato (pixel) e lo azzera. Zero allocazioni. */
  consumeLook(out: InputVec2): InputVec2 {
    out.x = this.lookX;
    out.y = this.lookY;
    this.lookX = 0;
    this.lookY = 0;
    return out;
  }

  // --- azioni edge ---------------------------------------------------------

  trigger(action: InputAction): void {
    this.listeners[action].forEach((cb) => cb());
  }

  /** Registra un listener per un'azione edge. Restituisce la funzione di unsubscribe. */
  onAction(action: InputAction, listener: Listener): () => void {
    this.listeners[action].add(listener);
    return () => {
      this.listeners[action].delete(listener);
    };
  }

  // --- reset ---------------------------------------------------------------

  /** Azzera tasti, joystick, corsa e look. Da chiamare su blur / visibilitychange / touchcancel. */
  reset(): void {
    this.keys.clear();
    this.joyX = 0;
    this.joyY = 0;
    this.touchRun = false;
    this.lookX = 0;
    this.lookY = 0;
    this.recompute();
  }

  private recompute(): void {
    const k = this.keys;
    const anyDown = (codes: readonly string[]): number => (codes.some((c) => k.has(c)) ? 1 : 0);
    let x = anyDown(KEY_RIGHT) - anyDown(KEY_LEFT);
    let y = anyDown(KEY_FORWARD) - anyDown(KEY_BACK);
    const kLen = Math.hypot(x, y);
    if (kLen > 1) {
      x /= kLen;
      y /= kLen;
    }
    x += this.joyX;
    y += this.joyY;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.axis.x = x;
    this.axis.y = y;
    const joyMag = Math.hypot(this.joyX, this.joyY);
    this.runFlag =
      anyDown(KEY_RUN) === 1 ||
      this.touchRun ||
      joyMag >= (AUTO_RUN_THRESHOLD - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE);
  }
}

/** Istanza singleton usata dal gioco. I test creano istanze proprie. */
export const input = new InputManager();

// ---------------------------------------------------------------------------
// Collegamento al DOM (tastiera)
// ---------------------------------------------------------------------------

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

function isButtonLike(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.tagName === 'BUTTON' || target.tagName === 'A');
}

/**
 * Collega tastiera + eventi di reset (blur, visibilitychange, touchcancel).
 * Ignora i tasti con modificatori (Ctrl/Meta/Alt) e i campi di testo. Restituisce il detach.
 */
export function attachKeyboard(target: Window = window, manager: InputManager = input): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey || isTextEntry(e.target)) return;
    const handled = manager.setKey(e.code, true, e.repeat);
    // Evita lo scroll di pagina con frecce/spazio, ma non rompere i pulsanti nativi (Spazio su <button>).
    if (handled && !isButtonLike(e.target) && (e.code === 'Space' || e.code.startsWith('Arrow'))) {
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    manager.setKey(e.code, false);
  };
  const onReset = (): void => manager.reset();
  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') manager.reset();
  };
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onReset);
  target.addEventListener('touchcancel', onReset);
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('blur', onReset);
    target.removeEventListener('touchcancel', onReset);
    document.removeEventListener('visibilitychange', onVisibility);
    manager.reset();
  };
}

// ---------------------------------------------------------------------------
// Collegamento al DOM (mouse look, SOLO desktop)
// ---------------------------------------------------------------------------

export interface MouseLookOptions {
  /** Il look e' attivo solo quando restituisce true (es. phase === 'playing'). */
  enabled: () => boolean;
  /** Chiamata se il pointer lock viene perso (Esc nel browser): tipicamente trigger('pause'). */
  onPointerLockLost?: () => void;
  manager?: InputManager;
}

/**
 * Click sull'elemento = pointer lock (solo mouse; i pointer touch sono ignorati: se ne occupa
 * TouchControls). Se il lock non e' disponibile, fallback: tieni premuto il tasto e trascina.
 */
export function attachMouseLook(element: HTMLElement, options: MouseLookOptions): () => void {
  const manager = options.manager ?? input;
  let dragging = false;
  let wasLocked = false;

  const onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' || !options.enabled()) return;
    dragging = true;
    if (
      document.pointerLockElement !== element &&
      typeof element.requestPointerLock === 'function'
    ) {
      Promise.resolve(element.requestPointerLock()).catch(() => undefined);
    }
  };
  const onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') dragging = false;
  };
  const onMouseMove = (e: MouseEvent): void => {
    if (!options.enabled()) return;
    if (document.pointerLockElement === element || dragging) {
      manager.addLookDelta(e.movementX, e.movementY);
    }
  };
  const onLockChange = (): void => {
    const locked = document.pointerLockElement === element;
    if (wasLocked && !locked) options.onPointerLockLost?.();
    wasLocked = locked;
  };
  const onContextMenu = (e: Event): void => e.preventDefault();

  element.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onLockChange);
  element.addEventListener('contextmenu', onContextMenu);
  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onLockChange);
    element.removeEventListener('contextmenu', onContextMenu);
    if (document.pointerLockElement === element) document.exitPointerLock();
  };
}
