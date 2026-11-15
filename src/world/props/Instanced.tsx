import { useLayoutEffect, useRef } from 'react';
import {
  Color,
  Euler,
  type InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import type { V3 } from '../geo';

export interface InstanceItem {
  pos: V3;
  rotY?: number;
  rot?: V3;
  scale?: V3 | number;
  color?: string;
}

interface Props {
  geometry: BufferGeometry;
  material: Material;
  items: readonly InstanceItem[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const p = new Vector3();
const s = new Vector3();
const c = new Color();

/** Una InstancedMesh riempita una sola volta (elementi statici ripetuti = 1 draw call). */
export function Instanced({
  geometry,
  material,
  items,
  castShadow = false,
  receiveShadow = false,
}: Props) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      p.set(it.pos[0], it.pos[1], it.pos[2]);
      if (it.rot) e.set(it.rot[0], it.rot[1] + (it.rotY ?? 0), it.rot[2]);
      else e.set(0, it.rotY ?? 0, 0);
      q.setFromEuler(e);
      const sc = it.scale ?? 1;
      if (typeof sc === 'number') s.set(sc, sc, sc);
      else s.set(sc[0], sc[1], sc[2]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      if (it.color) {
        c.set(it.color);
        mesh.setColorAt(i, c);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}
