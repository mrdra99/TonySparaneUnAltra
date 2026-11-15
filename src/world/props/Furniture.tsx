import { useMemo } from 'react';
import { BENCHES, BLEACHERS, BIN, LAMPS, TRASH_CANS, type Placement } from '../environments/layout';
import { matVC } from '../materials';
import { Instanced, type InstanceItem } from './Instanced';
import {
  getBenchGeometry,
  getBinGeometry,
  getBleachersGeometry,
  getLampGeometry,
  getTrashCanGeometry,
} from './propGeometries';

const toItems = (list: readonly Placement[]): InstanceItem[] =>
  list.map((p) => ({ pos: [p.x, 0, p.z], rotY: p.rotY }));

export function Benches() {
  const items = useMemo(() => toItems(BENCHES), []);
  return (
    <Instanced
      geometry={getBenchGeometry()}
      material={matVC}
      items={items}
      castShadow
      receiveShadow
    />
  );
}

export function StreetLamps() {
  const items = useMemo(() => toItems(LAMPS), []);
  return <Instanced geometry={getLampGeometry()} material={matVC} items={items} castShadow />;
}

export function TrashCans() {
  const items = useMemo(() => toItems(TRASH_CANS), []);
  return <Instanced geometry={getTrashCanGeometry()} material={matVC} items={items} castShadow />;
}

/** Gradinata in cemento con striscia gialla, graffiti e ringhiera tubolare. */
export function Bleachers() {
  return (
    <mesh
      geometry={getBleachersGeometry()}
      material={matVC}
      position={[BLEACHERS.cx, 0, BLEACHERS.zFront]}
      castShadow
      receiveShadow
    />
  );
}

/** Cassonetto della differenziata bianco/azzurro con oblo' colorati. */
export function RecycleBin() {
  return (
    <mesh
      geometry={getBinGeometry()}
      material={matVC}
      position={[BIN.x, 0, BIN.z]}
      castShadow
      receiveShadow
    />
  );
}
