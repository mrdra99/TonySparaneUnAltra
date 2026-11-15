/**
 * Geometrie dei prop dell'ambiente, costruite UNA volta (lazy) e condivise da tutte le
 * istanze. Sono risorse di modulo: vivono per tutta la sessione, quindi nessun dispose
 * per-componente (verrebbero ricreate inutilmente a ogni smontaggio/StrictMode).
 */
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry } from 'three';
import { BLEACHERS } from '../environments/layout';
import { type Part, type V3, blob, box, cyl, limb, makeRng, mergeParts, sphere } from '../geo';
import { PALETTE as P } from '../materials';

const cache = new Map<string, BufferGeometry>();
function memo(key: string, build: () => BufferGeometry): BufferGeometry {
  let g = cache.get(key);
  if (!g) {
    g = build();
    cache.set(key, g);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Panchina (fronte verso +z)
// ---------------------------------------------------------------------------
export function getBenchGeometry(): BufferGeometry {
  return memo('bench', () => {
    const parts: Part[] = [];
    const w = 1.9;
    // seduta: 3 listelli
    for (let i = 0; i < 3; i++) {
      parts.push(
        box(w, 0.05, 0.14, P.wood, { pos: [0, 0.46, 0.17 - i * 0.16], gradient: [0.9, 1.05] }),
      );
    }
    // schienale: 2 listelli inclinati
    for (let i = 0; i < 2; i++) {
      parts.push(
        box(w, 0.13, 0.04, P.wood, {
          pos: [0, 0.68 + i * 0.17, -0.27 - i * 0.03],
          rot: [-0.18, 0, 0],
        }),
      );
    }
    // fianchi in ghisa
    for (const sx of [-1, 1]) {
      parts.push(
        box(0.06, 0.46, 0.5, P.metal, { pos: [sx * (w / 2 - 0.08), 0.23, 0] }),
        box(0.06, 0.3, 0.06, P.metal, {
          pos: [sx * (w / 2 - 0.08), 0.62, -0.25],
          rot: [-0.18, 0, 0],
        }),
        box(0.07, 0.05, 0.46, P.metal, { pos: [sx * (w / 2 - 0.08), 0.62, 0.02] }),
      );
    }
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Lampione: palo + braccio curvo verso +z + testa con lente
// ---------------------------------------------------------------------------
export function getLampGeometry(): BufferGeometry {
  return memo('lamp', () => {
    const parts: Part[] = [];
    const pole = '#7d868c';
    parts.push(cyl(0.17, 0.2, 0.25, '#5d666b', { pos: [0, 0.125, 0] }, 8));
    parts.push(limb([0, 0.2, 0], [0, 5.7, 0], 0.11, 0.065, pole, {}, 8));
    const arm: V3[] = [
      [0, 5.7, 0],
      [0, 6.05, 0.18],
      [0, 6.28, 0.55],
      [0, 6.34, 1.0],
      [0, 6.3, 1.45],
    ];
    for (let i = 0; i < arm.length - 1; i++) {
      const a = arm[i];
      const b = arm[i + 1];
      if (a && b) parts.push(limb(a, b, 0.055, 0.05, pole, {}, 6));
    }
    parts.push(sphere(0.07, pole, { pos: [0, 5.7, 0] }, 6));
    parts.push(box(0.3, 0.1, 0.62, '#4f585d', { pos: [0, 6.34, 1.62], rot: [0.08, 0, 0] }));
    parts.push(box(0.24, 0.035, 0.5, '#fff1c2', { pos: [0, 6.28, 1.62], rot: [0.08, 0, 0] }));
    return mergeParts(parts);
  });
}

export function getTrashCanGeometry(): BufferGeometry {
  return memo('trash', () =>
    mergeParts([
      cyl(0.26, 0.22, 0.82, '#4c5f55', { pos: [0, 0.41, 0] }, 8),
      cyl(0.28, 0.28, 0.06, '#2d3a34', { pos: [0, 0.85, 0] }, 8),
      box(0.04, 0.1, 0.3, '#c9d2cf', { pos: [0, 0.62, 0.25] }),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Pini marittimi: tronco sottile e inclinato + chioma a ombrello (origine = cima del tronco)
// ---------------------------------------------------------------------------
const PINE_PATHS: ReadonlyArray<readonly V3[]> = [
  [
    [0, 0, 0],
    [0.2, 3, 0.1],
    [0.9, 6.2, 0.3],
    [1.2, 9.2, 0.1],
    [1.0, 12, 0],
  ],
  [
    [0, 0, 0],
    [-0.3, 3.2, 0.2],
    [-1, 6.5, 0.6],
    [-0.7, 9.5, 0.4],
    [-0.2, 12, 0.2],
  ],
  [
    [0, 0, 0],
    [0.1, 3.4, -0.2],
    [0.4, 6.8, -0.6],
    [-0.3, 9.6, -0.5],
    [-0.9, 12, -0.2],
  ],
];
/** Altezza di riferimento del tronco (la scena scala uniformemente). */
export const PINE_BASE_HEIGHT = 12;

export function getPineTrunkGeometry(variant: number): BufferGeometry {
  const v = ((variant % 3) + 3) % 3;
  return memo(`pineTrunk${v}`, () => {
    const path = PINE_PATHS[v] ?? PINE_PATHS[0]!;
    const parts: Part[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      if (!a || !b) continue;
      const t0 = i / (path.length - 1);
      const t1 = (i + 1) / (path.length - 1);
      const r0 = 0.38 - 0.2 * t0;
      const r1 = 0.38 - 0.2 * t1;
      parts.push(limb(a, b, r0, r1, t0 > 0.45 ? P.pineBarkTop : P.pineBark, {}, 6));
    }
    return mergeParts(parts);
  });
}

export function getPineTop(variant: number): V3 {
  const v = ((variant % 3) + 3) % 3;
  const path = PINE_PATHS[v] ?? PINE_PATHS[0]!;
  return path[path.length - 1] ?? [0, PINE_BASE_HEIGHT, 0];
}

export function getPineCrownGeometry(variant: number): BufferGeometry {
  const v = ((variant % 3) + 3) % 3;
  return memo(`pineCrown${v}`, () => {
    const rng = makeRng(777 + v * 31);
    const parts: Part[] = [];
    // rami spessi verso l'esterno
    const branches = 5;
    for (let i = 0; i < branches; i++) {
      const a = (i / branches) * Math.PI * 2 + rng();
      const rr = 1.8 + rng() * 1.3;
      const y = -1.6 + rng() * 1.0;
      parts.push(
        limb(
          [0, -2.4 + rng() * 0.8, 0],
          [Math.cos(a) * rr, y, Math.sin(a) * rr],
          0.1,
          0.05,
          P.pineBarkTop,
          {},
          5,
        ),
      );
    }
    // cuore della chioma + cuscini di aghi
    parts.push(
      blob(
        2.5,
        P.pineNeedle,
        { pos: [0, 0.35, 0], scale: [1.25, 0.42, 1.25], gradient: [0.72, 1.18] },
        1,
      ),
    );
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rng() * 0.6;
      const rr = 2.1 + rng() * 1.5;
      const r = 1.3 + rng() * 0.8;
      parts.push(
        blob(
          r,
          rng() < 0.4 ? P.pineNeedleLight : P.pineNeedle,
          {
            pos: [Math.cos(a) * rr, -0.55 + rng() * 1.1, Math.sin(a) * rr],
            scale: [1.2, 0.46, 1.2],
            gradient: [0.7, 1.2],
          },
          1,
        ),
      );
    }
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Leccio: grande chioma tonda e scura (origine a terra)
// ---------------------------------------------------------------------------
export function getOakTrunkGeometry(): BufferGeometry {
  return memo('oakTrunk', () =>
    mergeParts([
      limb([0, 0, 0], [0.1, 2.4, 0], 0.62, 0.42, '#4a3a30', {}, 7),
      limb([0.1, 2.2, 0], [-1.3, 4.0, 0.4], 0.28, 0.16, '#4a3a30', {}, 5),
      limb([0.1, 2.2, 0], [1.4, 4.2, -0.3], 0.28, 0.16, '#4a3a30', {}, 5),
      limb([0.1, 2.2, 0], [0.2, 4.6, 0.9], 0.24, 0.14, '#4a3a30', {}, 5),
    ]),
  );
}

export function getOakCrownGeometry(): BufferGeometry {
  return memo('oakCrown', () => {
    const rng = makeRng(4242);
    const parts: Part[] = [];
    parts.push(
      blob(
        2.9,
        P.oakLeaf,
        { pos: [0, 5.2, 0], scale: [1.15, 0.95, 1.15], gradient: [0.65, 1.15] },
        1,
      ),
    );
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rng() * 0.5;
      const rr = 1.5 + rng() * 1.6;
      const y = 3.4 + rng() * 3.2;
      const r = 1.5 + rng() * 1.1;
      parts.push(
        blob(
          r,
          rng() < 0.3 ? P.oakLeafLight : P.oakLeaf,
          {
            pos: [Math.cos(a) * rr, y, Math.sin(a) * rr],
            gradient: [0.65, 1.2],
          },
          1,
        ),
      );
    }
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Alberi della quinta lontana (instanziati): tronco + due blob
// ---------------------------------------------------------------------------
export function getFarTreeGeometry(): BufferGeometry {
  return memo('farTree', () =>
    mergeParts([
      limb([0, 0, 0], [0.2, 4.5, 0], 0.22, 0.14, P.pineBark, {}, 5),
      blob(
        2.2,
        P.pineNeedle,
        { pos: [0.2, 5.2, 0], scale: [1.4, 0.6, 1.4], gradient: [0.7, 1.15] },
        1,
      ),
      blob(1.4, P.pineNeedleLight, { pos: [-0.9, 4.7, 0.4], scale: [1.2, 0.55, 1.2] }, 1),
    ]),
  );
}

// ---------------------------------------------------------------------------
// Cespuglio / siepe (blob unitario, colore per istanza)
// ---------------------------------------------------------------------------
export function getBushGeometry(): BufferGeometry {
  return memo('bush', () => new IcosahedronGeometry(1, 1));
}

// ---------------------------------------------------------------------------
// Gradinata (origine: centro del fronte a terra; i gradoni salgono verso -z)
// ---------------------------------------------------------------------------
export function getBleachersGeometry(): BufferGeometry {
  return memo('bleachers', () => {
    const { width: W, steps, stepDepth: sd, stepHeight: sh } = BLEACHERS;
    const rng = makeRng(9001);
    const parts: Part[] = [];
    // gradoni
    for (let i = 0; i < steps; i++) {
      const tone = i % 2 === 0 ? '#9d9a92' : '#a6a39a';
      parts.push(
        box(W, (i + 1) * sh, sd, tone, {
          pos: [0, ((i + 1) * sh) / 2, -(i + 0.5) * sd],
          gradient: [0.72, 1.06],
        }),
      );
      // striscia gialla centrale
      parts.push(
        box(1.25, sh + 0.02, sd + 0.02, '#e3c231', {
          pos: [0, (i + 0.5) * sh + 0.01, -(i + 0.5) * sd + 0.005],
        }),
      );
    }
    // cordolo di base
    parts.push(box(W + 0.6, 0.12, 0.4, '#8f8c84', { pos: [0, 0.06, 0.1] }));
    // scritte e graffiti sulle alzate
    const tagColors = ['#3a3937', '#3a3937', '#42403d', '#7e8fa6', '#9b4a40', '#d8d5cb'];
    for (let n = 0; n < 34; n++) {
      const i = Math.floor(rng() * steps);
      let x = (rng() - 0.5) * (W - 1.2);
      if (Math.abs(x) < 0.9) x += x < 0 ? -1.1 : 1.1;
      const wd = 0.25 + rng() * 0.9;
      const ht = 0.04 + rng() * 0.12;
      const color = tagColors[Math.floor(rng() * tagColors.length)] ?? '#3a3937';
      parts.push(
        box(wd, ht, 0.012, color, { pos: [x, (i + 0.25 + rng() * 0.5) * sh, -i * sd + 0.007] }),
      );
    }
    // ringhiera: posti + traverse (dietro e sui fianchi inclinati)
    const metal = '#7b8488';
    const topY = steps * sh;
    const backZ = -steps * sd + 0.08;
    for (let x = -W / 2 + 0.1; x <= W / 2 + 0.01; x += 2) {
      parts.push(limb([x, topY, backZ], [x, topY + 1.05, backZ], 0.028, 0.028, metal, {}, 5));
    }
    for (const h of [0.35, 0.7, 1.05]) {
      parts.push(
        limb(
          [-W / 2 + 0.1, topY + h, backZ],
          [W / 2 - 0.1, topY + h, backZ],
          0.022,
          0.022,
          metal,
          {},
          4,
        ),
      );
    }
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 + 0.1);
      for (let i = 0; i <= steps; i += 1) {
        const y0 = Math.min(i, steps) * sh;
        const z = -i * sd + (i === steps ? 0.08 : -0.02);
        parts.push(limb([x, y0, z], [x, y0 + 1.05, z], 0.028, 0.028, metal, {}, 5));
      }
      for (const h of [0.45, 1.05]) {
        parts.push(limb([x, h, 0.05], [x, topY + h, backZ], 0.022, 0.022, metal, {}, 4));
      }
    }
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Cassonetto della differenziata (asse lungo x, fronte +z, origine centro a terra)
// ---------------------------------------------------------------------------
export function getBinGeometry(): BufferGeometry {
  return memo('bin', () => {
    const parts: Part[] = [];
    parts.push(box(3.4, 0.22, 1.5, '#3b4046', { pos: [0, 0.11, 0] }));
    parts.push(box(3.3, 0.95, 1.4, '#eef2f2', { pos: [0, 0.7, 0] }));
    parts.push(
      cyl(
        0.7,
        0.7,
        3.3,
        '#e4eef1',
        { pos: [0, 1.17, 0], rot: [0, 0, Math.PI / 2], scale: [0.55, 1, 1] },
        14,
      ),
    );
    // pannelli dipinti sul fronte
    parts.push(box(2.1, 0.72, 0.04, '#6cc4d8', { pos: [-0.55, 0.62, 0.71] }));
    parts.push(box(1.2, 0.6, 0.045, '#45a889', { pos: [-0.85, 0.6, 0.72] }));
    parts.push(box(0.5, 0.4, 0.05, '#2d6fb0', { pos: [-1.3, 0.55, 0.725] }));
    parts.push(box(0.5, 0.4, 0.05, '#f2c230', { pos: [-0.2, 0.55, 0.725] }));
    parts.push(box(0.6, 0.5, 0.045, '#f6f6f2', { pos: [0.75, 0.62, 0.71] }));
    // testata sinistra azzurra
    parts.push(box(0.05, 0.95, 1.3, '#58b7cf', { pos: [-1.66, 0.7, 0] }));
    // oblo' colorati
    const portholes = ['#3a3a3a', '#d9b92c', '#3b8f4f', '#2f6fb2', '#ededed'];
    portholes.forEach((c, i) => {
      parts.push(
        cyl(
          0.17,
          0.17,
          0.06,
          c,
          { pos: [-1.2 + i * 0.6, 1.36, 0.64], rot: [Math.PI / 2 - 0.35, 0, 0] },
          10,
        ),
      );
    });
    // cuore rosa e tag
    parts.push(sphere(0.075, '#e0508a', { pos: [0.62, 0.9, 0.73], scale: [1, 1, 0.2] }, 6));
    parts.push(sphere(0.075, '#e0508a', { pos: [0.78, 0.9, 0.73], scale: [1, 1, 0.2] }, 6));
    parts.push(
      box(0.11, 0.11, 0.01, '#e0508a', { pos: [0.7, 0.8, 0.735], rot: [0, 0, Math.PI / 4] }),
    );
    parts.push(box(0.45, 0.04, 0.01, '#232323', { pos: [0.7, 0.55, 0.735], rot: [0, 0, 0.3] }));
    parts.push(box(0.3, 0.035, 0.01, '#232323', { pos: [0.5, 0.42, 0.735], rot: [0, 0, -0.2] }));
    // bande rosso/bianche sulle testate
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        parts.push(
          box(0.06, 0.1, 0.26, k % 2 === 0 ? '#c5372c' : '#f4f1ea', {
            pos: [sx * 1.7, 0.42 + k * 0.1, 0.45],
          }),
        );
      }
    }
    // sportello inferiore
    parts.push(box(0.6, 0.35, 0.03, '#cfd7d8', { pos: [1.05, 0.5, 0.71] }));
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Edifici: tetto a due falde con coppi (prisma unitario: cresta lungo x, falde su z)
// ---------------------------------------------------------------------------
export function getRoofGeometry(): BufferGeometry {
  return memo('roof', () => {
    const pos: number[] = [];
    const tiles = 28;
    const amp = 0.012;
    const tri = (a: V3, b: V3, c: V3) => pos.push(...a, ...b, ...c);
    for (let i = 0; i < tiles; i++) {
      const x0 = -0.5 + i / tiles;
      const x1 = -0.5 + (i + 1) / tiles;
      const lift = i % 2 === 0 ? amp : -amp;
      for (const s of [-1, 1]) {
        const e0: V3 = [x0, lift * 0.5, s * 0.5];
        const e1: V3 = [x1, lift * 0.5, s * 0.5];
        const r0: V3 = [x0, 1 + lift, 0];
        const r1: V3 = [x1, 1 + lift, 0];
        if (s === 1) {
          tri(e0, r1, r0);
          tri(e0, e1, r1);
        } else {
          tri(e0, r0, r1);
          tri(e0, r1, e1);
        }
      }
    }
    // frontoni
    tri([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0]);
    tri([0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, 0]);
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  });
}

// ---------------------------------------------------------------------------
// Finestra / porta / balcone / tenda: unita' frontali (+z = esterno)
// ---------------------------------------------------------------------------
export function getWindowGeometry(): BufferGeometry {
  return memo('window', () =>
    mergeParts([
      box(1.2, 1.6, 0.1, '#f4f0e6', { pos: [0, 0, 0.02] }),
      box(0.98, 1.38, 0.12, P.glass, { pos: [0, 0, 0.045], gradient: [0.8, 1.25] }),
      box(0.05, 1.38, 0.14, '#f4f0e6', { pos: [0, 0, 0.06] }),
      box(0.98, 0.05, 0.14, '#f4f0e6', { pos: [0, 0.08, 0.06] }),
      box(1.5, 0.08, 0.26, '#b9b1a1', { pos: [0, -0.84, 0.1] }),
    ]),
  );
}

export function getShutterGeometry(): BufferGeometry {
  return memo('shutters', () => {
    const parts: Part[] = [];
    for (const sx of [-1, 1]) {
      parts.push(box(0.5, 1.58, 0.05, '#ffffff', { pos: [sx * 0.86, 0, 0.08] }));
      for (let k = 0; k < 6; k++) {
        parts.push(box(0.42, 0.025, 0.02, '#d0d0d0', { pos: [sx * 0.86, -0.65 + k * 0.26, 0.11] }));
      }
    }
    return mergeParts(parts);
  });
}

export function getDoorGeometry(): BufferGeometry {
  return memo('door', () =>
    mergeParts([
      box(1.5, 2.45, 0.1, '#f1ece0', { pos: [0, 0, 0.02] }),
      box(1.24, 2.3, 0.14, '#5a3b26', { pos: [0, -0.05, 0.05] }),
      box(0.05, 2.3, 0.16, '#3e2818', { pos: [0, -0.05, 0.06] }),
      box(1.7, 0.1, 0.5, '#a9a191', { pos: [0, -1.2, 0.2] }),
      sphere(0.04, '#d8b04a', { pos: [0.4, -0.05, 0.14] }, 5),
    ]),
  );
}

export function getBalconyGeometry(): BufferGeometry {
  return memo('balcony', () => {
    const parts: Part[] = [box(1.9, 0.14, 0.95, '#bdb4a2', { pos: [0, 0, 0.475] })];
    const rail = '#2b3033';
    const topY = 1.0;
    parts.push(
      box(1.9, 0.05, 0.05, rail, { pos: [0, topY, 0.93] }),
      box(0.05, 0.05, 0.95, rail, { pos: [-0.93, topY, 0.475] }),
      box(0.05, 0.05, 0.95, rail, { pos: [0.93, topY, 0.475] }),
      box(1.9, 0.04, 0.04, rail, { pos: [0, 0.2, 0.93] }),
    );
    for (let i = 0; i <= 8; i++) {
      parts.push(
        box(0.03, topY, 0.03, rail, { pos: [-0.93 + (i * 1.86) / 8, topY / 2 + 0.07, 0.93] }),
      );
    }
    for (const sx of [-1, 1]) {
      for (let i = 1; i <= 3; i++) {
        parts.push(
          box(0.03, topY, 0.03, rail, { pos: [sx * 0.93, topY / 2 + 0.07, 0.93 - i * 0.23] }),
        );
      }
    }
    return mergeParts(parts);
  });
}

export function getAwningGeometry(): BufferGeometry {
  return memo('awning', () => {
    const parts: Part[] = [];
    const stripes = 10;
    const w = 4.2;
    for (let i = 0; i < stripes; i++) {
      parts.push(
        box(w / stripes, 0.05, 1.1, i % 2 === 0 ? '#c4372c' : '#f3ecd8', {
          pos: [-w / 2 + (i + 0.5) * (w / stripes), 0, 0.55],
          rot: [0.38, 0, 0],
        }),
      );
    }
    parts.push(box(w, 0.2, 0.04, '#b0302a', { pos: [0, -0.2, 1.08] }));
    return mergeParts(parts);
  });
}
