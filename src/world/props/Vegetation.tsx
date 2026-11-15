import { useMemo } from 'react';
import { makeRng } from '../geo';
import { matFoliage, matInstanced } from '../materials';
import { Instanced, type InstanceItem } from './Instanced';
import { getBushGeometry, getFarTreeGeometry } from './propGeometries';

const BUSH_GREENS = ['#3f6a37', '#4a7740', '#35603a', '#557f3f'];

function bushRow(
  items: InstanceItem[],
  rng: () => number,
  from: [number, number],
  to: [number, number],
  step: number,
  size: number,
) {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = size * (0.75 + rng() * 0.55);
    items.push({
      pos: [
        from[0] + (to[0] - from[0]) * t + (rng() - 0.5) * 0.4,
        r * 0.55,
        from[1] + (to[1] - from[1]) * t + (rng() - 0.5) * 0.4,
      ],
      scale: [r * (1 + rng() * 0.3), r * (0.8 + rng() * 0.3), r * (1 + rng() * 0.3)],
      rotY: rng() * 6,
      color: BUSH_GREENS[Math.floor(rng() * BUSH_GREENS.length)],
    });
  }
}

/** Siepi ai margini e alberi della quinta lontana: due InstancedMesh. */
export function Vegetation() {
  const { bushes, trees } = useMemo(() => {
    const rng = makeRng(31337);
    const bushes: InstanceItem[] = [];
    // dietro la gradinata e sui lati nord
    bushRow(bushes, rng, [-21, -15.9], [-8.8, -15.9], 1.1, 0.95);
    bushRow(bushes, rng, [8.8, -15.9], [21, -15.9], 1.1, 0.95);
    // lungo i muri ovest ed est
    bushRow(bushes, rng, [-20.9, -14], [-20.9, -5.5], 1.2, 0.9);
    bushRow(bushes, rng, [20.9, -14.5], [20.9, -6], 1.2, 0.9);
    bushRow(bushes, rng, [20.9, 7], [20.9, 14], 1.3, 0.85);
    // cespugli accanto alla gradinata (come nella foto)
    bushRow(bushes, rng, [-9.8, -14.2], [-9.3, -12.6], 1.2, 0.9);
    bushRow(bushes, rng, [-15.5, -13.2], [-17.5, -9.5], 1.3, 0.85);

    const trees: InstanceItem[] = [];
    for (let i = 0; i < 60; i++) {
      const a = rng() * Math.PI * 2;
      const dist = 44 + rng() * 26;
      const x = Math.cos(a) * dist * 1.2;
      const z = Math.sin(a) * dist * 0.9;
      // solo a nord e agli angoli: le altre direzioni sono occupate dalle case
      if (z > -10 && Math.abs(x) < 60) continue;
      const s = 0.9 + rng() * 0.8;
      trees.push({ pos: [x, 0, z], scale: s, rotY: rng() * 6 });
    }
    return { bushes, trees };
  }, []);

  return (
    <group>
      <Instanced
        geometry={getBushGeometry()}
        material={matInstanced}
        items={bushes}
        castShadow
        receiveShadow
      />
      <Instanced geometry={getFarTreeGeometry()} material={matFoliage} items={trees} />
    </group>
  );
}
