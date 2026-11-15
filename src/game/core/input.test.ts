import {
  AUTO_RUN_THRESHOLD,
  InputManager,
  JOYSTICK_DEADZONE,
  attachKeyboard,
  type InputAction,
} from './input';

describe('InputManager tastiera', () => {
  it('WASD e frecce producono assi discreti (avanti = y+, destra = x+)', () => {
    const i = new InputManager();
    i.setKey('KeyW', true);
    expect(i.moveAxis).toEqual({ x: 0, y: 1 });
    i.setKey('ArrowRight', true);
    expect(i.moveAxis.x).toBeCloseTo(Math.SQRT1_2);
    expect(i.moveAxis.y).toBeCloseTo(Math.SQRT1_2);
    i.setKey('KeyW', false);
    i.setKey('ArrowRight', false);
    i.setKey('KeyS', true);
    i.setKey('KeyA', true);
    expect(i.moveAxis.x).toBeCloseTo(-Math.SQRT1_2);
    expect(i.moveAxis.y).toBeCloseTo(-Math.SQRT1_2);
  });
  it('tasti opposti si annullano', () => {
    const i = new InputManager();
    i.setKey('KeyA', true);
    i.setKey('KeyD', true);
    expect(i.moveAxis.x).toBe(0);
  });
  it('shift = run', () => {
    const i = new InputManager();
    expect(i.run).toBe(false);
    i.setKey('ShiftLeft', true);
    expect(i.run).toBe(true);
    i.setKey('ShiftLeft', false);
    expect(i.run).toBe(false);
  });
  it('ignora i tasti non tracciati', () => {
    const i = new InputManager();
    expect(i.setKey('KeyQ', true)).toBe(false);
    expect(i.setKey('KeyW', true)).toBe(true);
  });
});

describe('azioni edge', () => {
  const cases: [string, InputAction][] = [
    ['KeyE', 'interact'],
    ['Space', 'advance'],
    ['Escape', 'pause'],
    ['KeyM', 'missions'],
    ['Digit1', 'choice1'],
    ['Digit3', 'choice3'],
  ];
  it.each(cases)('%s scatta %s una volta per pressione', (code, action) => {
    const i = new InputManager();
    const cb = vi.fn();
    i.onAction(action, cb);
    i.setKey(code, true);
    i.setKey(code, true, true); // auto-repeat
    i.setKey(code, true); // gia premuto
    expect(cb).toHaveBeenCalledTimes(1);
    i.setKey(code, false);
    i.setKey(code, true);
    expect(cb).toHaveBeenCalledTimes(2);
  });
  it('unsubscribe funziona e trigger() scatta da qualsiasi sorgente (touch)', () => {
    const i = new InputManager();
    const cb = vi.fn();
    const off = i.onAction('interact', cb);
    i.trigger('interact');
    off();
    i.trigger('interact');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('joystick e look', () => {
  it('dead-zone: sotto soglia = 0', () => {
    const i = new InputManager();
    i.setJoystick(0.1, 0.1);
    expect(i.moveAxis).toEqual({ x: 0, y: 0 });
    i.setJoystick(JOYSTICK_DEADZONE - 0.01, 0);
    expect(i.moveAxis.x).toBe(0);
  });
  it('analogico continuo e clampato a lunghezza 1', () => {
    const i = new InputManager();
    i.setJoystick(0, 0.575); // meta' tra dead-zone e 1
    expect(i.moveAxis.y).toBeGreaterThan(0.4);
    expect(i.moveAxis.y).toBeLessThan(0.6);
    i.setJoystick(1, 1);
    expect(Math.hypot(i.moveAxis.x, i.moveAxis.y)).toBeCloseTo(1);
  });
  it('corsa automatica oltre la soglia, non sotto', () => {
    const i = new InputManager();
    i.setJoystick(0, 0.5);
    expect(i.run).toBe(false);
    i.setJoystick(0, AUTO_RUN_THRESHOLD + 0.02);
    expect(i.run).toBe(true);
    i.setJoystick(0, 0);
    expect(i.run).toBe(false);
  });
  it('setTouchRun forza la corsa', () => {
    const i = new InputManager();
    i.setTouchRun(true);
    expect(i.run).toBe(true);
  });
  it('tastiera + joystick si sommano con clamp', () => {
    const i = new InputManager();
    i.setKey('KeyW', true);
    i.setJoystick(0, 1);
    expect(i.moveAxis.y).toBeCloseTo(1);
  });
  it('lookDelta si accumula e consumeLook lo azzera', () => {
    const i = new InputManager();
    i.addLookDelta(3, 1);
    i.addLookDelta(2, -4);
    const out = { x: 0, y: 0 };
    expect(i.consumeLook(out)).toEqual({ x: 5, y: -3 });
    expect(i.consumeLook(out)).toEqual({ x: 0, y: 0 });
  });
});

describe('reset', () => {
  it('reset() azzera tasti, joystick, corsa e look', () => {
    const i = new InputManager();
    i.setKey('KeyW', true);
    i.setKey('ShiftLeft', true);
    i.setJoystick(1, 0);
    i.setTouchRun(true);
    i.addLookDelta(10, 10);
    i.reset();
    expect(i.moveAxis).toEqual({ x: 0, y: 0 });
    expect(i.run).toBe(false);
    expect(i.consumeLook({ x: 1, y: 1 })).toEqual({ x: 0, y: 0 });
    expect(i.isKeyDown('KeyW')).toBe(false);
  });
  it('blur, visibilitychange (hidden) e touchcancel resettano tutto', () => {
    const i = new InputManager();
    const detach = attachKeyboard(window, i);
    const press = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    press();
    expect(i.moveAxis.y).toBe(1);
    window.dispatchEvent(new Event('blur'));
    expect(i.moveAxis.y).toBe(0);

    press();
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(i.moveAxis.y).toBe(0);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

    press();
    i.setJoystick(1, 0);
    window.dispatchEvent(new Event('touchcancel'));
    expect(i.moveAxis).toEqual({ x: 0, y: 0 });
    detach();
  });
  it('attachKeyboard: eventi DOM aggiornano lo stato, i campi di testo sono ignorati, detach pulisce', () => {
    const i = new InputManager();
    const detach = attachKeyboard(window, i);
    const cb = vi.fn();
    i.onAction('interact', cb);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    expect(cb).toHaveBeenCalledTimes(1);

    const field = document.createElement('input');
    document.body.appendChild(field);
    field.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
    expect(i.moveAxis.y).toBe(0);
    field.remove();

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', ctrlKey: true }));
    expect(cb).toHaveBeenCalledTimes(1);

    detach();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
