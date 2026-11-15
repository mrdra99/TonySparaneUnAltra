import { HEAD_MAX_YAW, TORSO_MAX_YAW, computeAttention, type AttentionOutput } from './attention';

const out = (): AttentionOutput => ({ active: false, headYaw: 0, torsoYaw: 0, distance: 0 });
const base = { npcX: 0, npcZ: 0, npcRotationY: 0, watchesTony: true };

describe('computeAttention', () => {
  it('non guarda se watchesTony e false o Tony e fuori raggio', () => {
    expect(
      computeAttention({ ...base, tonyX: 1, tonyZ: 1, watchesTony: false }, out()).active,
    ).toBe(false);
    expect(computeAttention({ ...base, tonyX: 50, tonyZ: 0 }, out()).active).toBe(false);
  });
  it('Tony davanti: testa dritta', () => {
    const r = computeAttention({ ...base, tonyX: 0, tonyZ: 4 }, out());
    expect(r.active).toBe(true);
    expect(r.headYaw).toBeCloseTo(0);
    expect(r.torsoYaw).toBeCloseTo(0);
  });
  it('Tony di lato: gira la testa (verso +X = yaw positivo) senza muovere il busto', () => {
    const r = computeAttention({ ...base, tonyX: 3, tonyZ: 3 }, out());
    expect(r.headYaw).toBeCloseTo(Math.PI / 4);
    expect(r.torsoYaw).toBe(0);
  });
  it('la testa e limitata e il resto passa al busto quando Tony e dietro', () => {
    const r = computeAttention({ ...base, tonyX: 0, tonyZ: -4 }, out());
    expect(Math.abs(r.headYaw)).toBeLessThanOrEqual(HEAD_MAX_YAW + 1e-9);
    expect(Math.abs(r.torsoYaw)).toBeLessThanOrEqual(TORSO_MAX_YAW + 1e-9);
    expect(Math.abs(r.headYaw) + Math.abs(r.torsoYaw)).toBeGreaterThan(HEAD_MAX_YAW);
  });
  it('tiene conto dell orientamento a riposo', () => {
    const r = computeAttention({ ...base, npcRotationY: Math.PI / 2, tonyX: 4, tonyZ: 0 }, out());
    expect(r.headYaw).toBeCloseTo(0);
  });
});
