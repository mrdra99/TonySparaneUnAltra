import { describe, expect, it } from 'vitest';
import { buildTony } from './TonyModel';

describe('TonyModel - capelli', () => {
  it('la testa non ha masse oltre il ciuffo (niente chignon/punte verticali)', () => {
    const { head } = buildTony();
    head.computeBoundingBox();
    const box = head.boundingBox;
    expect(box).not.toBeNull();
    // centro testa 0.2 sopra il pivot: cranio 0.167, capelli + occhiali <= ~0.22
    expect(box!.max.y).toBeLessThanOrEqual(0.2 + 0.22);
    expect(box!.max.y).toBeGreaterThan(0.2 + 0.17);
  });

  it('i capelli restano nel guscio del cranio sui lati (corti)', () => {
    const { head } = buildTony();
    head.computeBoundingBox();
    // larghezza massima: orecchie/capelli, nessuna sporgenza laterale anomala
    expect(head.boundingBox!.max.x).toBeLessThan(0.18);
    expect(head.boundingBox!.min.x).toBeGreaterThan(-0.18);
  });
});
