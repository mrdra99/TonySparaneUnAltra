import { describe, expect, it } from 'vitest';
import { box, mergeParts, sphere } from '../geo';
import * as G from './propGeometries';

describe('mergeParts', () => {
  it('fonde le parti in una geometria con attributo color', () => {
    const g = mergeParts([box(1, 1, 1, '#ff0000'), sphere(0.5, '#00ff00', { pos: [0, 1, 0] })]);
    expect(g.getAttribute('position').count).toBeGreaterThan(36);
    expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
    g.dispose();
  });
});

describe('geometrie dei prop', () => {
  it('si costruiscono senza errori e sono non vuote', () => {
    const geos = [
      G.getBenchGeometry(),
      G.getLampGeometry(),
      G.getTrashCanGeometry(),
      G.getPineTrunkGeometry(0),
      G.getPineTrunkGeometry(1),
      G.getPineTrunkGeometry(2),
      G.getPineCrownGeometry(0),
      G.getPineCrownGeometry(1),
      G.getPineCrownGeometry(2),
      G.getOakTrunkGeometry(),
      G.getOakCrownGeometry(),
      G.getFarTreeGeometry(),
      G.getBushGeometry(),
      G.getBleachersGeometry(),
      G.getBinGeometry(),
      G.getRoofGeometry(),
      G.getWindowGeometry(),
      G.getShutterGeometry(),
      G.getDoorGeometry(),
      G.getBalconyGeometry(),
      G.getAwningGeometry(),
    ];
    for (const g of geos) expect(g.getAttribute('position').count).toBeGreaterThan(0);
  });

  it('e memoizzata (stessa istanza)', () => {
    expect(G.getBenchGeometry()).toBe(G.getBenchGeometry());
  });
});
