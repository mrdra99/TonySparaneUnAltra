import { createShotOut, dialogueShot, followBackVector, menuOrbitAngle } from './cameraShots';

describe('dialogueShot', () => {
  it('la camera sta a ~offset dal punto medio, di lato', () => {
    const o = dialogueShot(0, 0, 0, 2, true, 0, 1, createShotOut(), 3);
    expect(o.lookX).toBeCloseTo(0);
    expect(o.lookZ).toBeCloseTo(1);
    // perpendicolare a z: spostamento sull asse x, arretrata di 0.6 lungo -z
    expect(Math.hypot(o.camX - o.lookX, o.camZ - o.lookZ)).toBeGreaterThan(2.9);
    expect(Math.abs(o.camX)).toBeCloseTo(3);
  });
  it('i due lati sono speculari', () => {
    const a = dialogueShot(0, 0, 0, 2, true, 0, 1, createShotOut());
    const b = dialogueShot(0, 0, 0, 2, true, 0, -1, createShotOut());
    expect(a.camX).toBeCloseTo(-b.camX);
    expect(a.camZ).toBeCloseTo(b.camZ);
  });
  it('senza interlocutore (o troppo vicino) usa la direzione di Tony', () => {
    const o = dialogueShot(1, 1, 1, 1, true, Math.PI / 2, 1, createShotOut());
    expect(Number.isFinite(o.camX)).toBe(true);
    const n = dialogueShot(0, 0, 0, 0, false, 0, 1, createShotOut());
    expect(n.lookX).toBe(0);
    expect(n.lookZ).toBe(0);
  });
});

describe('menuOrbitAngle', () => {
  it('oscilla entro i limiti e rallenta con reducedMotion', () => {
    for (let t = 0; t < 100; t += 3) {
      expect(Math.abs(menuOrbitAngle(t, false))).toBeLessThanOrEqual(1.05 + 1e-9);
      expect(Math.abs(menuOrbitAngle(t, true))).toBeLessThanOrEqual(0.35 + 1e-9);
    }
  });
});

describe('followBackVector', () => {
  it('yaw 0 guarda +Z: la camera sta dietro, a -Z, e sopra con pitch positivo', () => {
    const v = followBackVector(0, 0.35, { x: 0, y: 0, z: 0 });
    expect(v.z).toBeLessThan(0);
    expect(v.y).toBeGreaterThan(0);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1);
  });
});
