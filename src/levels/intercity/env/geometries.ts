// OWNER: Finale. Geometrie low-poly dei livelli del flashback, costruite UNA volta (lazy) e condivise.
// Ogni geometria e' una fusione di primitive con vertex color (1 draw call), come in src/world/props.
// Risorse di modulo: vivono per tutta la sessione, nessun dispose per-componente.
import type { BufferGeometry } from 'three';
import { type Part, type V3, box, cone, cyl, limb, makeRng, mergeParts } from '@/world/geo';
import { COACH_DOOR_OFFSETS, PISA_COLUMN_XS, PISA_COLUMN_Z } from '../logic/colliders';

const cache = new Map<string, BufferGeometry>();
function memo(key: string, build: () => BufferGeometry): BufferGeometry {
  let g = cache.get(key);
  if (!g) {
    g = build();
    cache.set(key, g);
  }
  return g;
}

const WINDOW_XS: readonly { x: number; w: number }[] = [
  { x: -1.6, w: 1.3 },
  { x: 0, w: 1.3 },
  { x: 1.6, w: 1.3 },
  { x: -6.0 + 0.4, w: 0.7 },
  { x: 6.0 - 0.4, w: 0.7 },
];

// ---------------------------------------------------------------------------
// Vagone Intercity: origine al centro, lato porte verso +z e -z (simmetrico)
// ---------------------------------------------------------------------------
export function getCoachGeometry(): BufferGeometry {
  return memo('coach', () => {
    const parts: Part[] = [];
    parts.push(box(11.6, 0.45, 2.5, '#20242e', { pos: [0, 0.6, 0] })); // sottocassa
    parts.push(box(12, 2.9, 3, '#dfe4ea', { pos: [0, 2.25, 0], gradient: [0.82, 1.05] }));
    parts.push(box(12.04, 0.5, 3.04, '#2a6f8f', { pos: [0, 1.5, 0] })); // fascia blu
    parts.push(box(12.06, 0.12, 3.06, '#c93a2b', { pos: [0, 1.88, 0] })); // filetto rosso
    parts.push(box(11.6, 0.2, 2.5, '#8d95a3', { pos: [0, 3.8, 0] })); // tetto
    parts.push(box(2.4, 0.22, 1.2, '#6c7482', { pos: [2.5, 3.98, 0] })); // condizionatore
    parts.push(box(0.35, 2.3, 2.3, '#1c2029', { pos: [6.05, 2.1, 0] })); // intercomunicante
    parts.push(box(0.35, 2.3, 2.3, '#1c2029', { pos: [-6.05, 2.1, 0] }));
    for (const bx of [-4, 4]) {
      parts.push(box(2.4, 0.4, 2.1, '#12151c', { pos: [bx, 0.3, 0] })); // carrello
      for (const dx of [-0.9, 0.9]) {
        for (const sz of [-1, 1]) {
          parts.push(
            cyl(
              0.4,
              0.4,
              0.12,
              '#2d323d',
              { pos: [bx + dx, 0.4, sz * 1.0], rot: [Math.PI / 2, 0, 0] },
              8,
            ),
          );
        }
      }
    }
    for (const sz of [-1, 1]) {
      // cornici scure dei finestrini (il vetro luminoso e' in getCoachWindowsGeometry)
      for (const w of WINDOW_XS) {
        parts.push(box(w.w + 0.16, 1.04, 0.06, '#1d2431', { pos: [w.x, 2.7, sz * 1.5] }));
      }
      for (const dx of COACH_DOOR_OFFSETS) {
        parts.push(box(1.4, 2.6, 0.08, '#9e2f24', { pos: [dx, 2.1, sz * 1.5] })); // porta
        parts.push(box(0.5, 0.7, 0.1, '#1d2431', { pos: [dx, 2.8, sz * 1.52] })); // oblo' della porta
        parts.push(box(0.08, 0.5, 0.1, '#e6c14f', { pos: [dx + 0.45, 2.0, sz * 1.54] })); // maniglia
        parts.push(box(1.4, 0.1, 0.55, '#555b66', { pos: [dx, 0.85, sz * 1.75] })); // gradino
      }
    }
    return mergeParts(parts);
  });
}

/** Vetri accesi del vagone (materiale unlit): fusi in un'unica geometria. */
export function getCoachWindowsGeometry(): BufferGeometry {
  return memo('coach-windows', () => {
    const parts: Part[] = [];
    for (const sz of [-1, 1]) {
      for (const w of WINDOW_XS) {
        parts.push(box(w.w, 0.88, 0.04, '#ffffff', { pos: [w.x, 2.7, sz * 1.53] }));
      }
      for (const dx of COACH_DOOR_OFFSETS) {
        parts.push(box(0.4, 0.6, 0.04, '#ffffff', { pos: [dx, 2.8, sz * 1.58] }));
      }
    }
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Binario di Pisa
// ---------------------------------------------------------------------------

/** Massicciata, rotaie e traversine del binario lungo X (centro z = 0). */
export function getTrackGeometry(): BufferGeometry {
  return memo('track', () => {
    const parts: Part[] = [];
    parts.push(box(80, 0.04, 5.6, '#2a2a31', { pos: [0, 0.02, 0] }));
    for (let x = -38; x <= 38; x += 0.85) {
      parts.push(box(0.28, 0.08, 2.5, '#3a2f27', { pos: [x, 0.07, 0] }));
    }
    for (const z of [-0.75, 0.75]) {
      parts.push(box(80, 0.12, 0.09, '#9aa1ab', { pos: [0, 0.16, z] }));
    }
    return mergeParts(parts);
  });
}

/** Marciapiede, striscia gialla, pensilina e muro del fabbricato viaggiatori (coordinate di Pisa). */
export function getPisaPlatformGeometry(): BufferGeometry {
  return memo('pisa-platform', () => {
    const parts: Part[] = [];
    parts.push(box(40, 0.05, 12.6, '#5d6475', { pos: [0, 0.025, 3.2], gradient: [0.9, 1.05] }));
    parts.push(box(40, 0.07, 0.35, '#d8d4c4', { pos: [0, 0.035, -2.95] })); // bordo
    parts.push(box(40, 0.075, 0.2, '#e6c14f', { pos: [0, 0.04, -2.35] })); // linea gialla
    // pensilina
    parts.push(box(36, 0.22, 9.4, '#46506a', { pos: [0, 4.1, 5.2] }));
    parts.push(box(36.2, 0.55, 0.18, '#c8cdd8', { pos: [0, 3.85, 0.55] }));
    for (const x of PISA_COLUMN_XS) {
      parts.push(cyl(0.12, 0.16, 4, '#7b8394', { pos: [x, 2, PISA_COLUMN_Z] }, 8));
    }
    // fabbricato viaggiatori sul fondo
    parts.push(box(42, 7, 3, '#2c3345', { pos: [0, 3.5, 11.05] }));
    parts.push(box(42, 0.5, 3.4, '#3a4358', { pos: [0, 7.1, 11.1] }));
    const posters: readonly (readonly [number, string])[] = [
      [-11, '#e0a63a'],
      [-8.6, '#3d6b8c'],
      [6, '#c0543a'],
      [8.4, '#5a8f6a'],
      [14.5, '#8b5fa0'],
    ];
    for (const [x, c] of posters) {
      parts.push(box(1.3, 1.85, 0.05, c, { pos: [x, 2.1, 9.5] }));
    }
    return mergeParts(parts);
  });
}

/** Finestre accese del fabbricato viaggiatori + fascio luminoso delle luci sotto la pensilina. */
export function getPisaWindowsGeometry(): BufferGeometry {
  return memo('pisa-windows', () => {
    const parts: Part[] = [];
    for (let x = -18; x <= 18; x += 3) {
      if (Math.abs(x - 2) < 0.1) continue;
      parts.push(box(1.1, 1.5, 0.05, '#ffffff', { pos: [x, 5.3, 9.5] }));
    }
    for (const x of [-9, 9, -2]) {
      parts.push(box(2.4, 0.08, 0.3, '#ffffff', { pos: [x, 3.95, 3.5] })); // plafoniere
    }
    return mergeParts(parts);
  });
}

/** Distributore automatico: origine ai piedi, fronte verso +z. */
export function getVendingGeometry(): BufferGeometry {
  return memo('vending', () => {
    const parts: Part[] = [
      box(0.95, 1.9, 0.8, '#7a1f2b', { pos: [0, 0.95, 0], gradient: [0.8, 1] }),
      box(0.96, 0.18, 0.82, '#3a0f15', { pos: [0, 1.82, 0] }),
      box(0.5, 0.18, 0.04, '#111', { pos: [0.1, 0.35, 0.41] }), // vano di ritiro
      box(0.14, 0.5, 0.04, '#cfcfcf', { pos: [0.34, 1.1, 0.41] }), // tastierino
    ];
    return mergeParts(parts);
  });
}

export function getVendingPanelGeometry(): BufferGeometry {
  return memo('vending-panel', () =>
    mergeParts([box(0.58, 1.15, 0.03, '#ffffff', { pos: [-0.12, 1.15, 0.405] })]),
  );
}

/** Skyline lontano di Pisa/Viareggio: sagome scure di edifici (fusione unica). */
export function getSkylineGeometry(): BufferGeometry {
  return memo('skyline', () => {
    const rnd = makeRng(4242);
    const parts: Part[] = [];
    for (let i = 0; i < 26; i++) {
      const w = 3 + rnd() * 5;
      const h = 4 + rnd() * 9;
      parts.push(
        box(w, h, 3 + rnd() * 3, i % 3 === 0 ? '#161c33' : '#121830', {
          pos: [-60 + i * 4.8 + rnd() * 2, h / 2, 0],
        }),
      );
    }
    return mergeParts(parts);
  });
}

export function getSkylineWindowsGeometry(): BufferGeometry {
  return memo('skyline-windows', () => {
    const rnd = makeRng(777);
    const parts: Part[] = [];
    for (let i = 0; i < 70; i++) {
      parts.push(
        box(0.5, 0.7, 0.05, '#ffffff', {
          pos: [-58 + rnd() * 116, 1.5 + rnd() * 9, 1.9],
        }),
      );
    }
    return mergeParts(parts);
  });
}

// ---------------------------------------------------------------------------
// Viareggio
// ---------------------------------------------------------------------------

/** Pavimentazioni del piazzale: marciapiede della stazione, strisce pedonali, cordoli. */
export function getViareggioGroundGeometry(): BufferGeometry {
  return memo('vgo-ground', () => {
    const parts: Part[] = [];
    parts.push(box(30, 0.06, 7.5, '#7a7585', { pos: [0, 0.03, -5.0], gradient: [0.9, 1.05] }));
    parts.push(box(30, 0.1, 0.3, '#c9c4b8', { pos: [0, 0.05, -1.35] })); // cordolo
    for (let i = 0; i < 9; i++) {
      parts.push(box(0.55, 0.02, 3.6, '#dcdcd4', { pos: [-13 + i * 0.95, 0.025, 6.2] })); // zebra
    }
    for (let x = -12; x <= 12; x += 6) {
      parts.push(box(2.4, 0.015, 0.14, '#e6c14f', { pos: [x, 0.02, 2.2] })); // tratteggio
    }
    return mergeParts(parts);
  });
}

/** Stazione di Viareggio: fronte in muratura chiara con arcate, torre centrale, cornicione. */
export function getViareggioStationGeometry(): BufferGeometry {
  return memo('vgo-station', () => {
    const parts: Part[] = [];
    const wall = '#b9ad96';
    parts.push(box(30, 6.5, 6.5, wall, { pos: [0, 3.25, -11.4], gradient: [0.7, 1.05] }));
    parts.push(box(8, 10.5, 5, '#c5b89e', { pos: [0, 5.25, -10.7], gradient: [0.7, 1.05] }));
    parts.push(box(30.6, 0.45, 6.9, '#8b6a52', { pos: [0, 6.7, -11.4] })); // cornicione
    parts.push(box(8.6, 0.5, 5.6, '#8b6a52', { pos: [0, 10.7, -10.7] }));
    parts.push(cone(5.2, 2.2, '#a4553a', { pos: [0, 12, -10.7], rot: [0, Math.PI / 4, 0] }, 4));
    for (const x of [-11, -7, 7, 11]) {
      parts.push(box(2.2, 3.4, 0.2, '#262a35', { pos: [x, 2, -8.1] })); // arcate
    }
    parts.push(box(3, 3.8, 0.2, '#262a35', { pos: [0, 2.1, -8.1] }));
    for (const x of [-14.2, -4.2, 4.2, 14.2]) {
      parts.push(box(0.5, 5.5, 0.5, '#a89c86', { pos: [x, 2.75, -8.0] })); // lesene
    }
    return mergeParts(parts);
  });
}

export function getViareggioStationWindowsGeometry(): BufferGeometry {
  return memo('vgo-station-windows', () => {
    const parts: Part[] = [];
    for (const x of [-11, -7, 7, 11, -13.2, 13.2]) {
      parts.push(box(1.4, 2.4, 0.05, '#ffffff', { pos: [x, 4.9, -8.12] }));
      parts.push(box(1.7, 2.8, 0.05, '#ffffff', { pos: [x, 2, -7.98] }));
    }
    parts.push(box(2.3, 3.2, 0.05, '#ffffff', { pos: [0, 2.1, -7.98] }));
    for (const y of [7.6, 9.2]) parts.push(box(1.2, 1.1, 0.05, '#ffffff', { pos: [0, y, -8.18] }));
    return mergeParts(parts);
  });
}

/** Taxi bianco: origine ai piedi al centro, lungo X, muso verso -X. */
export function getTaxiGeometry(): BufferGeometry {
  return memo('taxi', () => {
    const parts: Part[] = [];
    parts.push(box(4.4, 0.75, 1.8, '#f1f1ec', { pos: [0, 0.78, 0], gradient: [0.8, 1.05] }));
    parts.push(box(2.3, 0.7, 1.6, '#f1f1ec', { pos: [0.35, 1.5, 0], gradient: [0.85, 1] }));
    parts.push(box(2.1, 0.5, 1.64, '#1d2638', { pos: [0.35, 1.5, 0] })); // cristalli
    parts.push(box(4.45, 0.12, 1.82, '#e6c14f', { pos: [0, 0.82, 0] })); // fascia gialla
    parts.push(box(0.12, 0.22, 1.5, '#1a1a1f', { pos: [-2.22, 0.58, 0] })); // paraurti
    parts.push(box(0.12, 0.22, 1.5, '#1a1a1f', { pos: [2.22, 0.58, 0] }));
    for (const x of [-1.4, 1.5]) {
      for (const sz of [-1, 1]) {
        parts.push(
          cyl(
            0.34,
            0.34,
            0.22,
            '#15161a',
            { pos: [x, 0.34, sz * 0.82], rot: [Math.PI / 2, 0, 0] },
            8,
          ),
        );
      }
    }
    parts.push(box(0.9, 0.2, 0.34, '#f4f4ef', { pos: [0.35, 1.95, 0] })); // basamento insegna
    return mergeParts(parts);
  });
}

export function getTaxiLightsGeometry(): BufferGeometry {
  return memo('taxi-lights', () => {
    const parts: Part[] = [];
    for (const sz of [-1, 1]) {
      parts.push(box(0.06, 0.18, 0.28, '#ffffff', { pos: [-2.24, 0.88, sz * 0.62] }));
    }
    parts.push(box(0.8, 0.18, 0.3, '#ffffff', { pos: [0.35, 2.12, 0] })); // insegna TAXI luminosa
    return mergeParts(parts);
  });
}

/** Palma stilizzata: tronco curvo e ciuffo di foglie. Origine ai piedi. */
export function getPalmGeometry(): BufferGeometry {
  return memo('palm', () => {
    const parts: Part[] = [];
    const trunk: V3[] = [
      [0, 0, 0],
      [0.1, 1.7, 0.05],
      [0.3, 3.4, 0.15],
      [0.65, 4.9, 0.2],
    ];
    for (let i = 0; i < trunk.length - 1; i++) {
      const a = trunk[i];
      const b = trunk[i + 1];
      if (a && b) parts.push(limb(a, b, 0.22 - i * 0.03, 0.2 - i * 0.03, '#6b5440', {}, 6));
    }
    const top: V3 = [0.65, 4.9, 0.2];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tip: V3 = [top[0] + Math.cos(a) * 1.9, top[1] - 0.7, top[2] + Math.sin(a) * 1.9];
      parts.push(limb(top, tip, 0.1, 0.02, i % 2 === 0 ? '#2f5a3a' : '#3f7048', {}, 4));
    }
    parts.push(box(0.3, 0.3, 0.3, '#5a4632', { pos: [top[0], top[1] - 0.15, top[2]] }));
    return mergeParts(parts);
  });
}

/** Palo della fermata dei taxi (cartello azzurro in cima). Origine ai piedi. */
export function getStopPoleGeometry(): BufferGeometry {
  return memo('stop-pole', () =>
    mergeParts([cyl(0.05, 0.05, 2.6, '#8d949a', { pos: [0, 1.3, 0] }, 6)]),
  );
}

/** Automobili parcheggiate sul fondo (sagome per dare profondita'). */
export function getParkedCarsGeometry(): BufferGeometry {
  return memo('parked-cars', () => {
    const parts: Part[] = [];
    const colors = ['#4a5568', '#7a2f2f', '#2f4a68', '#6a6a60'];
    colors.forEach((c, i) => {
      const x = -11 + i * 6.5;
      parts.push(box(4, 0.8, 1.8, c, { pos: [x, 0.7, 12.3] }));
      parts.push(box(2.1, 0.65, 1.6, c, { pos: [x + 0.2, 1.4, 12.3] }));
      parts.push(box(1.9, 0.45, 1.64, '#10141f', { pos: [x + 0.2, 1.42, 12.3] }));
    });
    return mergeParts(parts);
  });
}
