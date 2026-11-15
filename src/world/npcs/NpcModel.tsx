/**
 * NPC stilizzato low-poly caricaturale (testa grande, naso pronunciato, occhi e sopracciglia).
 *
 * Gerarchia (origine ai piedi, il personaggio guarda verso +Z):
 *   root (Group, in NpcRig.root: posizione/rotazione le gestisce chi lo usa)
 *   └ sway     animazione idle (x/z/respiro) + scala in base all'altezza
 *     ├ legs   mesh statica (gambe + scarpe)
 *     └ hips
 *       └ torso (Object3D, pivot alla VITA: chi usa l'NPC puo' ruotarne la Y)
 *         ├ chest (mesh, respiro)
 *         ├ armL / armR (pivot alle spalle)
 *         └ head (Object3D, pivot al COLLO: chi usa l'NPC ruota Y/X per "guardare Tony")
 *           └ headInner (animazione idle: solo rotazione X/Z, mai la Y)
 *
 * L'idle non scrive MAI rotation.y di torso/head: e' riservata al sistema di attenzione.
 * Tutta la geometria di un NPC e' fusa in 5 mesh (gambe, busto, braccia x2, testa).
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BufferGeometry, Group, Object3D } from 'three';
import {
  type Part,
  type V3,
  blob,
  box,
  cone,
  cyl,
  hashString,
  limb,
  mergeParts,
  sphere,
  sphereArc,
  torus,
} from '../geo';
import { matVCSmooth } from '../materials';

export type NpcAppearance = {
  skin: string;
  shirt: string;
  pants: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bald' | 'cap' | 'curly';
  height: number;
  build?: 'slim' | 'normal' | 'broad';
  accessory?: 'glasses' | 'cap' | 'scarf' | 'none';
};

export type NpcRig = { root: Group; torso: Object3D; head: Object3D };

type Pose = 'stand' | 'sit' | 'lean';

/** Altezza di riferimento del modello base (m). */
const BASE_HEIGHT = 1.9;
const SHOE = '#2b2b30';
/** Altezza della testa sopra il pivot del collo (centro cranio). */
const HEAD_CY = 0.17;
const NECK_Y = 0.62;

interface NpcGeometries {
  legs: BufferGeometry;
  chest: BufferGeometry;
  armL: BufferGeometry;
  armR: BufferGeometry;
  head: BufferGeometry;
  hipY: number;
}

function buildNpc(a: Required<Omit<NpcAppearance, 'height'>>, pose: Pose): NpcGeometries {
  const bw = a.build === 'slim' ? 0.88 : a.build === 'broad' ? 1.2 : 1;
  const belly = a.build === 'broad' ? 1.12 : 1;
  const hipY = pose === 'sit' ? 0.54 : 0.9;

  // ---- gambe (relative alla radice, a terra) ----
  const legs: Part[] = [];
  legs.push(sphere(0.175, a.pants, { pos: [0, hipY, 0], scale: [1.05 * bw, 0.75, 0.82] }, 8));
  for (const sx of [-1, 1]) {
    const x = sx * 0.09 * bw;
    if (pose === 'sit') {
      legs.push(limb([x, hipY, 0], [x, hipY + 0.0, 0.42], 0.08, 0.07, a.pants, {}, 6));
      legs.push(limb([x, hipY, 0.42], [x, 0.1, 0.46], 0.07, 0.055, a.pants, {}, 6));
      legs.push(sphere(0.07, SHOE, { pos: [x, 0.05, 0.52], scale: [0.95, 0.65, 1.7] }, 6));
    } else {
      const crossed = pose === 'lean' && sx > 0;
      const dx = crossed ? -0.1 : 0;
      const dz = crossed ? 0.12 : 0;
      legs.push(limb([x, hipY, 0], [x + dx * 0.5, 0.48, dz * 0.5], 0.085, 0.07, a.pants, {}, 6));
      legs.push(
        limb([x + dx * 0.5, 0.48, dz * 0.5], [x + dx, 0.08, dz], 0.07, 0.055, a.pants, {}, 6),
      );
      legs.push(
        sphere(0.07, SHOE, { pos: [x + dx, 0.05, dz + 0.06], scale: [0.95, 0.65, 1.7] }, 6),
      );
    }
  }

  // ---- busto (relativo al pivot della vita) ----
  const chest: Part[] = [];
  chest.push(sphere(0.2, a.shirt, { pos: [0, 0.3, 0], scale: [1.08 * bw, 1.5, 0.72 * belly] }, 9));
  chest.push(
    sphere(0.17, a.shirt, { pos: [0, 0.08, 0.01], scale: [1.1 * bw, 0.9, 0.82 * belly] }, 8),
  );
  // collo
  chest.push(cyl(0.05, 0.055, 0.1, a.skin, { pos: [0, 0.58, 0] }, 6));
  if (a.accessory === 'scarf') {
    chest.push(
      torus(0.085, 0.034, '#b9382b', { pos: [0, 0.57, 0], rot: [Math.PI / 2, 0, 0] }, 6, 10),
    );
    chest.push(box(0.07, 0.2, 0.03, '#b9382b', { pos: [0.07, 0.45, 0.14], rot: [0, 0, 0.1] }));
  }

  // ---- braccia (pivot alla spalla) ----
  const armGeo = (sx: number): BufferGeometry => {
    let elbow: V3 = [sx * 0.03, -0.27, 0.02];
    let wrist: V3 = [sx * 0.04, -0.5, 0.07];
    if (pose === 'lean') {
      elbow = [sx * 0.02, -0.27, 0.07];
      wrist = [-sx * 0.1, -0.3, 0.2];
    } else if (pose === 'sit') {
      elbow = [sx * 0.04, -0.27, 0.08];
      wrist = [sx * 0.03, -0.36, 0.3];
    }
    const parts: Part[] = [
      limb([0, 0, 0], elbow, 0.052, 0.045, a.shirt, {}, 6),
      limb(elbow, wrist, 0.042, 0.036, a.skin, {}, 6),
      sphere(0.05, a.shirt, { pos: [0, 0, 0] }, 6),
      sphere(0.044, a.skin, { pos: [wrist[0], wrist[1] - 0.02, wrist[2] + 0.005] }, 6),
    ];
    return mergeParts(parts);
  };

  // ---- testa ----
  const head: Part[] = [];
  const hs = 1.12; // testa grande: caricatura
  head.push(sphere(0.145 * hs, a.skin, { pos: [0, HEAD_CY, 0], scale: [1, 1.08, 0.98] }, 12));
  // mento e guance
  head.push(sphere(0.07, a.skin, { pos: [0, HEAD_CY - 0.11, 0.07], scale: [1.2, 0.8, 0.9] }, 8));
  // naso pronunciato
  head.push(
    cone(
      0.034,
      0.1,
      a.skin,
      { pos: [0, HEAD_CY - 0.015, 0.165 * hs], rot: [Math.PI / 2 + 0.25, 0, 0] },
      5,
    ),
  );
  head.push(sphere(0.026, a.skin, { pos: [0, HEAD_CY - 0.04, 0.17 * hs] }, 6));
  // orecchie
  for (const sx of [-1, 1]) {
    head.push(
      sphere(
        0.036,
        a.skin,
        { pos: [sx * 0.152 * hs, HEAD_CY - 0.005, -0.005], scale: [0.5, 1, 0.8] },
        6,
      ),
    );
  }
  // occhi + sopracciglia
  for (const sx of [-1, 1]) {
    head.push(
      sphere(
        0.03,
        '#fbfbf8',
        { pos: [sx * 0.056 * hs, HEAD_CY + 0.03, 0.128 * hs], scale: [1, 1.05, 0.6] },
        7,
      ),
    );
    head.push(sphere(0.015, '#1b1b1e', { pos: [sx * 0.056 * hs, HEAD_CY + 0.03, 0.14 * hs] }, 5));
    head.push(
      box(0.07, 0.016, 0.02, a.hairStyle === 'bald' ? '#3a2b22' : a.hair, {
        pos: [sx * 0.058 * hs, HEAD_CY + 0.075, 0.13 * hs],
        rot: [0, 0, -sx * 0.18],
      }),
    );
  }
  // bocca
  head.push(box(0.06, 0.012, 0.02, '#8a3a36', { pos: [0, HEAD_CY - 0.085, 0.138 * hs] }));

  // capelli
  const hairTop = HEAD_CY;
  switch (a.hairStyle) {
    case 'short':
      head.push(
        sphereArc(
          0.153 * hs,
          a.hair,
          [0, Math.PI * 2, 0, Math.PI * 0.5],
          { pos: [0, hairTop + 0.004, 0], rot: [-0.7, 0, 0], scale: [1, 1.08, 0.98] },
          12,
        ),
      );
      break;
    case 'long':
      head.push(
        sphereArc(
          0.153 * hs,
          a.hair,
          [0, Math.PI * 2, 0, Math.PI * 0.52],
          { pos: [0, hairTop + 0.004, 0], rot: [-0.72, 0, 0], scale: [1, 1.08, 0.98] },
          12,
        ),
      );
      head.push(
        sphere(0.15, a.hair, { pos: [0, HEAD_CY - 0.09, -0.07], scale: [1.05, 1.45, 0.55] }, 8),
      );
      for (const sx of [-1, 1])
        head.push(
          sphere(
            0.045,
            a.hair,
            { pos: [sx * 0.15, HEAD_CY - 0.07, -0.02], scale: [0.6, 1.8, 1] },
            6,
          ),
        );
      break;
    case 'curly': {
      head.push(
        sphereArc(
          0.15 * hs,
          a.hair,
          [0, Math.PI * 2, 0, Math.PI * 0.42],
          { pos: [0, hairTop + 0.01, 0], rot: [-0.55, 0, 0], scale: [1, 1.08, 0.98] },
          10,
        ),
      );
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const rr = 0.115 * hs;
        head.push(
          blob(
            0.05,
            a.hair,
            {
              pos: [
                Math.cos(ang) * rr,
                hairTop + 0.12 + (i % 2) * 0.03,
                Math.sin(ang) * rr * 0.9 - 0.01,
              ],
            },
            0,
          ),
        );
      }
      head.push(blob(0.07, a.hair, { pos: [0, hairTop + 0.17, 0] }, 0));
      break;
    }
    case 'cap':
      head.push(
        sphereArc(
          0.158 * hs,
          a.hair,
          [0, Math.PI * 2, 0, Math.PI * 0.46],
          { pos: [0, hairTop + 0.01, 0], rot: [-0.15, 0, 0], scale: [1, 1.05, 1] },
          12,
        ),
      );
      head.push(
        box(0.2, 0.014, 0.12, a.hair, { pos: [0, hairTop + 0.08, 0.17 * hs], rot: [0.12, 0, 0] }),
      );
      break;
    case 'bald':
      for (const sx of [-1, 1])
        head.push(
          sphere(
            0.05,
            a.hair,
            { pos: [sx * 0.13 * hs, hairTop + 0.0, -0.04], scale: [0.5, 1.1, 1.2] },
            6,
          ),
        );
      break;
  }

  // accessori
  if (a.accessory === 'glasses') {
    for (const sx of [-1, 1]) {
      head.push(
        torus(
          0.034,
          0.007,
          '#232323',
          { pos: [sx * 0.056 * hs, HEAD_CY + 0.03, 0.14 * hs] },
          5,
          12,
        ),
      );
    }
    head.push(box(0.04, 0.008, 0.008, '#232323', { pos: [0, HEAD_CY + 0.035, 0.145 * hs] }));
  } else if (a.accessory === 'cap' && a.hairStyle !== 'cap') {
    head.push(
      sphereArc(
        0.158 * hs,
        '#2f5f9a',
        [0, Math.PI * 2, 0, Math.PI * 0.46],
        { pos: [0, hairTop + 0.012, 0], rot: [-0.15, 0, 0], scale: [1, 1.05, 1] },
        12,
      ),
    );
    head.push(
      box(0.2, 0.014, 0.12, '#2f5f9a', { pos: [0, hairTop + 0.08, 0.17 * hs], rot: [0.12, 0, 0] }),
    );
  }

  return {
    legs: mergeParts(legs),
    chest: mergeParts(chest),
    armL: armGeo(1),
    armR: armGeo(-1),
    head: mergeParts(head),
    hipY,
  };
}

interface Props {
  appearance: NpcAppearance;
  pose?: Pose;
}

export const NpcModel = forwardRef<NpcRig, Props>(function NpcModel(
  { appearance, pose = 'stand' },
  ref,
) {
  const { skin, shirt, pants, hair, hairStyle, height } = appearance;
  const build = appearance.build ?? 'normal';
  const accessory = appearance.accessory ?? 'none';

  const geos = useMemo(
    () => buildNpc({ skin, shirt, pants, hair, hairStyle, build, accessory }, pose),
    [skin, shirt, pants, hair, hairStyle, build, accessory, pose],
  );
  useEffect(
    () => () => {
      geos.legs.dispose();
      geos.chest.dispose();
      geos.armL.dispose();
      geos.armR.dispose();
      geos.head.dispose();
    },
    [geos],
  );

  // fase deterministica per NPC (niente Math.random in render)
  const phase = useMemo(
    () => (hashString(`${skin}${shirt}${pants}${hair}${hairStyle}${height}`) % 6283) / 1000,
    [skin, shirt, pants, hair, hairStyle, height],
  );

  const root = useRef<Group>(null);
  const sway = useRef<Group>(null);
  const hips = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const chest = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const head = useRef<Group>(null);
  const headInner = useRef<Group>(null);

  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return root.current as Group;
      },
      get torso() {
        return torso.current as Object3D;
      },
      get head() {
        return head.current as Object3D;
      },
    }),
    [],
  );

  const baseTilt = pose === 'lean' ? 0.1 : 0;
  const scale = height / BASE_HEIGHT;
  const bw = build === 'slim' ? 0.88 : build === 'broad' ? 1.2 : 1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const sw = sway.current;
    const hp = hips.current;
    if (!sw || !hp) return;
    // respiro lento + piccoli cambi di peso (somma di sinusoidi lente, mai sincrone fra NPC)
    const breath = Math.sin(t * 1.6 + phase);
    const shift = Math.sin(t * 0.23 + phase) + 0.6 * Math.sin(t * 0.51 + phase * 2);
    sw.rotation.z = baseTilt + shift * 0.012;
    sw.rotation.x = Math.sin(t * 0.31 + phase * 1.3) * 0.006;
    sw.position.x = shift * 0.012;
    hp.rotation.z = -shift * 0.014;
    hp.rotation.x = 0;
    const c = chest.current;
    if (c) c.scale.set(1 + breath * 0.01, 1 + breath * 0.017, 1 + breath * 0.012);
    const hi = headInner.current;
    if (hi) {
      hi.rotation.x = Math.sin(t * 0.7 + phase) * 0.025;
      hi.rotation.z = Math.sin(t * 0.43 + phase * 0.7) * 0.03;
    }
    const al = armL.current;
    const ar = armR.current;
    if (pose === 'stand') {
      if (al) al.rotation.x = Math.sin(t * 1.2 + phase) * 0.03;
      if (ar) ar.rotation.x = Math.sin(t * 1.2 + phase + 1.6) * 0.03;
    }
  });

  return (
    <group ref={root}>
      <group ref={sway} scale={scale}>
        <mesh geometry={geos.legs} material={matVCSmooth} castShadow receiveShadow />
        <group ref={hips} position={[0, geos.hipY, 0]}>
          <group ref={torso}>
            <group ref={chest}>
              <mesh geometry={geos.chest} material={matVCSmooth} castShadow receiveShadow />
            </group>
            <group ref={armL} position={[0.225 * bw, 0.47, 0]}>
              <mesh geometry={geos.armL} material={matVCSmooth} castShadow />
            </group>
            <group ref={armR} position={[-0.225 * bw, 0.47, 0]}>
              <mesh geometry={geos.armR} material={matVCSmooth} castShadow />
            </group>
            <group ref={head} position={[0, NECK_Y, 0]}>
              <group ref={headInner}>
                <mesh geometry={geos.head} material={matVCSmooth} castShadow />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
