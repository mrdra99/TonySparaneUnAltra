import {
  HEAD_MAX_PITCH,
  HEAD_MAX_YAW,
  REACTION_EMOTE,
  TORSO_MAX_YAW,
  computeAttention,
  createAttentionOutput,
  createReactionState,
  stepAttention,
  updateReaction,
} from './attention';

const out = createAttentionOutput;
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
  it('limiti: testa max ~70 gradi, busto max ~50 e solo se Tony e dietro', () => {
    const r = computeAttention({ ...base, tonyX: 0, tonyZ: -4 }, out());
    expect(Math.abs(r.headYaw)).toBeLessThanOrEqual(HEAD_MAX_YAW + 1e-9);
    expect(Math.abs(r.torsoYaw)).toBeLessThanOrEqual(TORSO_MAX_YAW + 1e-9);
    expect(Math.abs(r.torsoYaw)).toBeGreaterThan(0);
    expect(HEAD_MAX_YAW).toBeCloseTo((70 * Math.PI) / 180);
  });
  it('tiene conto dell orientamento a riposo', () => {
    const r = computeAttention({ ...base, npcRotationY: Math.PI / 2, tonyX: 4, tonyZ: 0 }, out());
    expect(r.headYaw).toBeCloseTo(0);
  });
  it('isteresi: resta agganciato appena oltre il raggio se gia attivo', () => {
    const input = { ...base, radius: 5, tonyX: 5.5, tonyZ: 0 };
    expect(computeAttention(input, out()).active).toBe(false);
    expect(computeAttention({ ...input, wasActive: true }, out()).active).toBe(true);
  });
  it('inclina la testa verso il basso se Tony e piu basso e limita il pitch', () => {
    const r = computeAttention({ ...base, tonyX: 0, tonyZ: 2, npcEyeY: 1.8, tonyEyeY: 1.0 }, out());
    expect(r.headPitch).toBeGreaterThan(0);
    const near = computeAttention(
      { ...base, tonyX: 0, tonyZ: 0.1, npcEyeY: 3, tonyEyeY: 0 },
      out(),
    );
    expect(Math.abs(near.headPitch)).toBeLessThanOrEqual(HEAD_MAX_PITCH + 1e-9);
  });
});

describe('stepAttention', () => {
  const target = { headYaw: 1, torsoYaw: 0.5, headPitch: 0.2 };
  it('converge verso il target senza scatti e senza superarlo', () => {
    const pose = { headYaw: 0, torsoYaw: 0, headPitch: 0 };
    let prev = 0;
    for (let i = 0; i < 30; i++) {
      stepAttention(pose, target, true, 1 / 60);
      expect(pose.headYaw).toBeGreaterThanOrEqual(prev);
      expect(pose.headYaw).toBeLessThanOrEqual(1);
      prev = pose.headYaw;
    }
    expect(pose.headYaw).toBeGreaterThan(0.5);
  });
  it('e indipendente dal frame rate (60 fps vs 30 fps)', () => {
    const a = { headYaw: 0, torsoYaw: 0, headPitch: 0 };
    const b = { headYaw: 0, torsoYaw: 0, headPitch: 0 };
    for (let i = 0; i < 60; i++) stepAttention(a, target, true, 1 / 60);
    for (let i = 0; i < 30; i++) stepAttention(b, target, true, 1 / 30);
    expect(a.headYaw).toBeCloseTo(b.headYaw, 6);
    expect(a.torsoYaw).toBeCloseTo(b.torsoYaw, 6);
  });
  it('quando non e coinvolto torna alla posa piu lentamente', () => {
    const fast = { headYaw: 1, torsoYaw: 0, headPitch: 0 };
    const slow = { headYaw: 1, torsoYaw: 0, headPitch: 0 };
    const zero = { headYaw: 0, torsoYaw: 0, headPitch: 0 };
    stepAttention(fast, zero, true, 0.1);
    stepAttention(slow, zero, false, 0.1);
    expect(slow.headYaw).toBeGreaterThan(fast.headYaw);
  });
});

describe('updateReaction', () => {
  const lines = ['Ma questo non era in Russia?', 'Tony, ma i miei cinque euro?'];
  const always = () => 0.5;
  it('scatta solo all ingresso nel raggio', () => {
    const st = createReactionState();
    expect(updateReaction(st, false, 0, always, lines, { emoteChance: 0 })).toBeNull();
    expect(updateReaction(st, true, 1, always, lines, { emoteChance: 0 })).not.toBeNull();
    expect(updateReaction(st, true, 2, always, lines, { emoteChance: 0 })).toBeNull();
  });
  it('rispetta il cooldown', () => {
    const st = createReactionState();
    updateReaction(st, true, 0, always, lines, { cooldown: [10, 10] });
    updateReaction(st, false, 1, always, lines);
    expect(updateReaction(st, true, 2, always, lines, { cooldown: [10, 10] })).toBeNull();
    updateReaction(st, false, 11, always, lines);
    expect(updateReaction(st, true, 12, always, lines, { cooldown: [10, 10] })).not.toBeNull();
  });
  it('non ripete subito la stessa battuta e usa l emote quando richiesto', () => {
    const st = createReactionState();
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      updateReaction(st, false, i * 100, always, lines);
      const r = updateReaction(st, true, i * 100 + 50, () => 0.6, lines, { emoteChance: 0 });
      if (r) seen.push(r);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
    const st2 = createReactionState();
    const low = () => 0.1;
    expect(updateReaction(st2, true, 0, low, lines, { emoteChance: 1 })).toBe(REACTION_EMOTE);
  });
  it('senza battute usa l emote', () => {
    const st = createReactionState();
    expect(updateReaction(st, true, 0, () => 0.1, [])).toBe(REACTION_EMOTE);
  });
});
