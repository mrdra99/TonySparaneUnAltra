import { useMemo } from 'react';
import { BoxGeometry } from 'three';
import { BUILDINGS, BUILDING_SIGNS, facadeFrame, type BuildingSpec } from '../environments/layout';
import { matInstanced, matRoof, matVC } from '../materials';
import { Instanced, type InstanceItem } from './Instanced';
import {
  getAwningGeometry,
  getBalconyGeometry,
  getDoorGeometry,
  getRoofGeometry,
  getShutterGeometry,
  getWindowGeometry,
} from './propGeometries';
import { Sign } from './Sign';

const wallGeo = new BoxGeometry(1, 1, 1);

interface BuildingItems {
  walls: InstanceItem[];
  roofs: InstanceItem[];
  windows: InstanceItem[];
  shutters: InstanceItem[];
  doors: InstanceItem[];
  balconies: InstanceItem[];
  awnings: InstanceItem[];
}

const SHUTTER_COLORS = ['#4b6b45', '#7a4f33', '#4b6b45', '#5a7a8a'];
const ROOF_COLORS = ['#b9532f', '#a84a2b', '#c25c36', '#b04e2e'];

function buildItems(list: readonly BuildingSpec[]): BuildingItems {
  const out: BuildingItems = {
    walls: [],
    roofs: [],
    windows: [],
    shutters: [],
    doors: [],
    balconies: [],
    awnings: [],
  };
  list.forEach((b, bi) => {
    const f = facadeFrame(b);
    // volume principale
    out.walls.push({ pos: [b.cx, b.h / 2, b.cz], scale: [b.w, b.h, b.d], color: b.color });
    // cornicioni e zoccolo lungo la facciata
    const at = (along: number, y: number, off: number): [number, number, number] => [
      f.x + f.tx * along + f.nx * off,
      y,
      f.z + f.tz * along + f.nz * off,
    ];
    out.walls.push({
      pos: at(0, b.h * 0.5, 0.1),
      rotY: f.rotY,
      scale: [f.length + 0.2, 0.24, 0.24],
      color: '#f1ece0',
    });
    out.walls.push({
      pos: at(0, b.h - 0.1, 0.18),
      rotY: f.rotY,
      scale: [f.length + 0.4, 0.3, 0.4],
      color: '#f1ece0',
    });
    out.walls.push({
      pos: at(0, 0.3, 0.06),
      rotY: f.rotY,
      scale: [f.length + 0.1, 0.6, 0.12],
      color: '#b5ab9a',
    });
    // tetto a due falde con coppi
    const rh = b.roofHeight ?? 2.2;
    const alongX = b.w >= b.d;
    out.roofs.push({
      pos: [b.cx, b.h - 0.05, b.cz],
      rotY: alongX ? 0 : Math.PI / 2,
      scale: alongX ? [b.w + 0.9, rh, b.d + 0.9] : [b.d + 0.9, rh, b.w + 0.9],
      color: b.roofColor ?? ROOF_COLORS[bi % ROOF_COLORS.length],
    });
    // comignolo
    out.walls.push({
      pos: [b.cx + (alongX ? b.w * 0.28 : 0), b.h + rh * 0.8, b.cz + (alongX ? 0 : b.d * 0.28)],
      scale: [0.8, 1.6, 0.8],
      color: '#b08a6a',
    });

    // aperture sulla facciata
    const cols = Math.max(2, Math.round(f.length / 3.4));
    const spacing = f.length / cols;
    const doorCol = Math.floor((cols - 1) / 2);
    for (let i = 0; i < cols; i++) {
      const along = (i + 0.5) * spacing - f.length / 2;
      const shutterColor = SHUTTER_COLORS[(i + bi) % SHUTTER_COLORS.length];
      if (i === doorCol) {
        out.doors.push({ pos: at(along, 1.25, 0.02), rotY: f.rotY });
        if (b.shop) out.awnings.push({ pos: at(along, 3.0, 0.02), rotY: f.rotY });
      } else if (b.shop) {
        out.windows.push({ pos: at(along, 1.7, 0.02), rotY: f.rotY, scale: [1.5, 1.15, 1] });
      } else {
        out.windows.push({ pos: at(along, 1.75, 0.02), rotY: f.rotY });
        out.shutters.push({ pos: at(along, 1.75, 0.02), rotY: f.rotY, color: shutterColor });
      }
      // piano superiore
      out.windows.push({ pos: at(along, 5.1, 0.02), rotY: f.rotY, scale: [1, 1.15, 1] });
      out.shutters.push({
        pos: at(along, 5.1, 0.02),
        rotY: f.rotY,
        scale: [1, 1.15, 1],
        color: shutterColor,
      });
      if (cols >= 3 && i % 2 === 0 && b.h > 6) {
        out.balconies.push({ pos: at(along, 3.75, 0.02), rotY: f.rotY });
      }
    }
  });
  return out;
}

/** Tutti gli edifici fuori dal perimetro: pochi draw call grazie all'instancing. */
export function Buildings() {
  const it = useMemo(() => buildItems(BUILDINGS), []);
  const signs = useMemo(
    () =>
      BUILDING_SIGNS.flatMap((s) => {
        const b = BUILDINGS.find((x) => x.id === s.building);
        if (!b) return [];
        const f = facadeFrame(b);
        return [
          {
            key: s.building + s.text,
            spec: s,
            position: [
              f.x + f.tx * s.along + f.nx * 0.2,
              s.y,
              f.z + f.tz * s.along + f.nz * 0.2,
            ] as const,
            rotY: f.rotY,
          },
        ];
      }),
    [],
  );
  return (
    <group>
      <Instanced geometry={wallGeo} material={matInstanced} items={it.walls} receiveShadow />
      <Instanced geometry={getRoofGeometry()} material={matRoof} items={it.roofs} receiveShadow />
      <Instanced geometry={getWindowGeometry()} material={matVC} items={it.windows} />
      <Instanced geometry={getShutterGeometry()} material={matInstanced} items={it.shutters} />
      <Instanced geometry={getDoorGeometry()} material={matVC} items={it.doors} />
      <Instanced geometry={getBalconyGeometry()} material={matVC} items={it.balconies} />
      <Instanced geometry={getAwningGeometry()} material={matVC} items={it.awnings} />
      {signs.map((s) => (
        <Sign
          key={s.key}
          lines={[s.spec.text]}
          bg={s.spec.bg}
          fg={s.spec.fg}
          width={s.spec.w}
          height={s.spec.h}
          position={s.position}
          rotationY={s.rotY}
        />
      ))}
    </group>
  );
}
