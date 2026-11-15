import { angleDelta, damp, dampAngle, inputToWorldDirection, wrapAngle } from './movementMath';

const out = () => ({ x: 0, z: 0 });

describe('inputToWorldDirection', () => {
  it('avanti con camera che guarda +Z va verso +Z', () => {
    const d = inputToWorldDirection(0, 1, 0, out());
    expect(d.x).toBeCloseTo(0);
    expect(d.z).toBeCloseTo(1);
  });
  it('destra con camera che guarda +Z va verso -X', () => {
    const d = inputToWorldDirection(1, 0, 0, out());
    expect(d.x).toBeCloseTo(-1);
    expect(d.z).toBeCloseTo(0);
  });
  it('camera che guarda -Z (yaw PI): avanti = -Z, destra = +X', () => {
    const f = inputToWorldDirection(0, 1, Math.PI, out());
    expect(f.z).toBeCloseTo(-1);
    const r = inputToWorldDirection(1, 0, Math.PI, out());
    expect(r.x).toBeCloseTo(1);
  });
  it('camera che guarda +X (yaw PI/2): avanti = +X', () => {
    const d = inputToWorldDirection(0, 1, Math.PI / 2, out());
    expect(d.x).toBeCloseTo(1);
    expect(d.z).toBeCloseTo(0);
  });
  it('preserva l intensita analogica', () => {
    const d = inputToWorldDirection(0, 0.5, 1.2, out());
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(0.5);
  });
});

describe('angoli', () => {
  it('wrapAngle', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(wrapAngle(0.5)).toBeCloseTo(0.5);
  });
  it('angleDelta prende la via piu breve', () => {
    expect(angleDelta(0.1, -0.1)).toBeCloseTo(-0.2);
    expect(angleDelta(Math.PI - 0.1, -Math.PI + 0.1)).toBeCloseTo(0.2);
  });
  it('damp converge ed e indipendente dal frame rate', () => {
    let a = 0;
    for (let i = 0; i < 60; i++) a = damp(a, 1, 5, 1 / 60);
    let b = 0;
    for (let i = 0; i < 30; i++) b = damp(b, 1, 5, 1 / 30);
    expect(a).toBeCloseTo(b, 5);
    expect(a).toBeGreaterThan(0.99);
  });
  it('dampAngle attraversa il salto +-PI', () => {
    const v = dampAngle(Math.PI - 0.1, -Math.PI + 0.1, 100, 1);
    expect(Math.abs(angleDelta(v, -Math.PI + 0.1))).toBeLessThan(0.001);
  });
});
