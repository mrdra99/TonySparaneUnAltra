/**
 * Bicicletta stilizzata e riconoscibile (telaio rosso, ruote a raggi, manubrio, sella, cestino).
 * Orientamento: asse lungo Z, il davanti punta a +Z, origine a terra al centro dell'interasse.
 * `wobble` 0..1: 0 = ferma (appoggiata col cavalletto), 1 = animazione comica (oscilla, ruote
 * che girano, saltello, manubrio che sbanda).
 */
import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BufferGeometry, Group } from 'three';
import { type Part, type V3, box, cyl, limb, mergeParts, sphere, torus } from '../geo';
import { matVC } from '../materials';

const FRAME = '#c4402b';
const FRAME_DARK = '#8f2c1e';
const STEEL = '#aeb4b8';
const BLACK = '#1f2124';
const R = 0.34;
const WB = 0.5; // semi-interasse

function wheelGeometry(): BufferGeometry {
  const parts: Part[] = [];
  parts.push(torus(R, 0.026, BLACK, { rot: [0, Math.PI / 2, 0] }, 5, 20));
  parts.push(torus(R - 0.03, 0.008, STEEL, { rot: [0, Math.PI / 2, 0] }, 4, 20));
  parts.push(cyl(0.035, 0.035, 0.07, STEEL, { rot: [0, 0, Math.PI / 2] }, 6));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI;
    parts.push(
      limb(
        [0, Math.cos(a) * (R - 0.03), Math.sin(a) * (R - 0.03)],
        [0, -Math.cos(a) * (R - 0.03), -Math.sin(a) * (R - 0.03)],
        0.004,
        0.004,
        STEEL,
        {},
        3,
      ),
    );
  }
  return mergeParts(parts);
}

function frameGeometry(): BufferGeometry {
  // z positivo = davanti
  const rear: V3 = [0, R, -WB];
  const bb: V3 = [0, 0.3, -0.12]; // movimento centrale
  const seat: V3 = [0, 0.86, -0.3];
  const head: V3 = [0, 0.84, 0.36];
  const headLow: V3 = [0, 0.62, 0.4];
  const parts: Part[] = [
    limb(rear, bb, 0.018, 0.02, FRAME, {}, 5), // forcellone inferiore
    limb(rear, seat, 0.017, 0.02, FRAME, {}, 5), // forcellone superiore
    limb(bb, seat, 0.022, 0.022, FRAME, {}, 5), // piantone
    limb(bb, headLow, 0.026, 0.024, FRAME, {}, 5), // obliquo
    limb(seat, head, 0.024, 0.022, FRAME, {}, 5), // orizzontale
    limb(seat, [0, 0.98, -0.32], 0.014, 0.014, STEEL, {}, 5), // reggisella
    box(0.09, 0.04, 0.26, '#3a2a24', { pos: [0, 1.0, -0.28], rot: [-0.05, 0, 0] }), // sella
    // pedivelle e pedali
    cyl(0.07, 0.07, 0.01, STEEL, { pos: [0.05, 0.3, -0.12], rot: [0, 0, Math.PI / 2] }, 10),
    limb([0.07, 0.3, -0.12], [0.07, 0.17, -0.12], 0.012, 0.012, STEEL, {}, 4),
    box(0.1, 0.02, 0.06, BLACK, { pos: [0.11, 0.17, -0.12] }),
    limb([-0.07, 0.3, -0.12], [-0.07, 0.43, -0.12], 0.012, 0.012, STEEL, {}, 4),
    box(0.1, 0.02, 0.06, BLACK, { pos: [-0.11, 0.43, -0.12] }),
    // parafango posteriore + portapacchi
    box(0.07, 0.015, 0.4, FRAME_DARK, { pos: [0, R + 0.1, -WB - 0.02], rot: [0.12, 0, 0] }),
    // cavalletto
    limb([0.04, 0.3, -0.5], [0.12, 0.0, -0.36], 0.01, 0.01, BLACK, {}, 4),
  ];
  return mergeParts(parts);
}

/** Forcella + manubrio + cestino + faro: ruota con lo sterzo. */
function steerGeometry(): BufferGeometry {
  const parts: Part[] = [
    limb([0.04, R, 0.5], [0.04, 0.84, 0.36], 0.014, 0.016, FRAME, {}, 5),
    limb([-0.04, R, 0.5], [-0.04, 0.84, 0.36], 0.014, 0.016, FRAME, {}, 5),
    limb([0, 0.84, 0.36], [0, 1.02, 0.33], 0.018, 0.016, STEEL, {}, 5),
    // manubrio
    limb([-0.28, 1.04, 0.3], [0.28, 1.04, 0.3], 0.013, 0.013, STEEL, {}, 5),
    sphere(0.026, BLACK, { pos: [0.29, 1.04, 0.3] }, 5),
    sphere(0.026, BLACK, { pos: [-0.29, 1.04, 0.3] }, 5),
    limb([0.28, 1.04, 0.3], [0.28, 1.0, 0.22], 0.012, 0.012, STEEL, {}, 4),
    limb([-0.28, 1.04, 0.3], [-0.28, 1.0, 0.22], 0.012, 0.012, STEEL, {}, 4),
    // faro + cestino anteriore
    sphere(0.045, '#f7e6a1', { pos: [0, 1.06, 0.4], scale: [1, 1, 0.8] }, 6),
    box(0.3, 0.2, 0.26, '#8a6a43', { pos: [0, 0.74, 0.62] }),
    box(0.3, 0.02, 0.26, '#6b4e2e', { pos: [0, 0.84, 0.62] }),
    limb([0, 0.9, 0.36], [0, 0.82, 0.5], 0.01, 0.01, STEEL, {}, 4),
  ];
  return mergeParts(parts);
}

export const Bicycle = forwardRef<Group, { wobble?: number }>(function Bicycle(
  { wobble = 0 },
  ref,
) {
  const geos = useMemo(
    () => ({ wheel: wheelGeometry(), frame: frameGeometry(), steer: steerGeometry() }),
    [],
  );
  useEffect(
    () => () => {
      geos.wheel.dispose();
      geos.frame.dispose();
      geos.steer.dispose();
    },
    [geos],
  );

  const body = useRef<Group>(null);
  const steer = useRef<Group>(null);
  const wheelF = useRef<Group>(null);
  const wheelR = useRef<Group>(null);
  const spin = useRef(0);
  const w = useRef(0);

  useFrame((state, delta) => {
    const b = body.current;
    if (!b) return;
    // il parametro viene smorzato: transizioni morbide fra fermo e "impazzito"
    w.current += (wobble - w.current) * (1 - Math.exp(-6 * delta));
    const k = w.current;
    const t = state.clock.elapsedTime;
    spin.current += delta * k * 12;
    if (wheelF.current) wheelF.current.rotation.x = spin.current;
    if (wheelR.current) wheelR.current.rotation.x = spin.current;
    // appoggiata: leggermente inclinata sul cavalletto; in wobble oscilla e saltella
    b.rotation.z = -0.07 * (1 - k) + Math.sin(t * 7) * 0.12 * k;
    b.rotation.x = Math.sin(t * 5.3) * 0.05 * k;
    b.position.y = Math.abs(Math.sin(t * 6)) * 0.14 * k;
    if (steer.current) steer.current.rotation.y = Math.sin(t * 5) * 0.35 * k;
  });

  return (
    <group ref={ref}>
      <group ref={body}>
        <mesh geometry={geos.frame} material={matVC} castShadow />
        <group ref={wheelR} position={[0, R, -WB]}>
          <mesh geometry={geos.wheel} material={matVC} castShadow />
        </group>
        {/* il perno dello sterzo e' sull'asse della forcella */}
        <group ref={steer} position={[0, 0.84, 0.36]}>
          <group position={[0, -0.84, -0.36]}>
            <mesh geometry={geos.steer} material={matVC} castShadow />
            <group ref={wheelF} position={[0, R, 0.5]}>
              <mesh geometry={geos.wheel} material={matVC} castShadow />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
