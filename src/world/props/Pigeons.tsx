import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Euler,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
} from 'three';
import { blob, cone, mergeParts, sphere } from '../geo';
import { matVC } from '../materials';

/** [x, z, rotY, fase] dei piccioni (solo decorazione, nessun collider). */
const SPOTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-4.6, 6.8, 0.6, 0.0],
  [-3.7, 7.6, 2.1, 1.9],
  [-5.2, 7.9, 4.0, 3.3],
  [8.8, 2.4, 1.0, 0.7],
  [9.7, 3.0, 3.6, 2.6],
  [-13.2, -1.2, 5.2, 4.1],
  [2.2, -3.4, 0.2, 5.0],
  [14.1, 6.5, 2.7, 1.2],
];

const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const p = new Vector3();
const s = new Vector3(1, 1, 1);

function pigeonGeometry(): BufferGeometry {
  return mergeParts([
    blob(0.1, '#8a929c', { pos: [0, 0.12, 0], scale: [0.8, 0.75, 1.25], gradient: [0.8, 1.1] }, 1),
    sphere(0.055, '#6f7a8a', { pos: [0, 0.2, 0.12] }, 6),
    cone(0.015, 0.045, '#d9a441', { pos: [0, 0.195, 0.18], rot: [Math.PI / 2, 0, 0] }, 4),
    cone(0.05, 0.14, '#6b727b', { pos: [0, 0.12, -0.17], rot: [-Math.PI / 2 + 0.4, 0, 0] }, 4),
    sphere(0.045, '#b9a6d0', { pos: [0, 0.17, 0.075], scale: [1.2, 0.8, 0.8] }, 5),
  ]);
}

/** Piccioni che becchettano il cemento: piccolo movimento ambientale (1 draw call). */
export function Pigeons() {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => pigeonGeometry(), []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < SPOTS.length; i++) {
      const sp = SPOTS[i];
      if (!sp) continue;
      const cyc = Math.sin(t * 2.4 + sp[3] * 3);
      const peck = cyc > 0.55 ? (cyc - 0.55) * 2.2 : 0;
      e.set(0.85 * peck, sp[2] + Math.sin(t * 0.4 + sp[3]) * 0.4, 0);
      q.setFromEuler(e);
      p.set(sp[0], 0, sp[1]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, matVC, SPOTS.length]} castShadow frustumCulled={false} />
  );
}
