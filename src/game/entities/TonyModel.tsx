/**
 * MODELLO DI TONY (protagonista) — procedurale, sostituibile con un GLB.
 *
 * CONVENZIONI (contratto con controller e camera, valide anche per un GLB):
 *  - Origine ai PIEDI (y = 0 e' il terreno), il personaggio guarda verso +Z.
 *  - Altezza ~1.82 m (cima dei capelli). Occhi ~1.66 m, centro testa ~1.63 m, spalle ~1.40 m.
 *  - Il componente NON si muove e NON ruota da solo: posizione/orientamento sono del
 *    chiamante (wrappa <TonyModel/> in un <group> mosso dal controller).
 *  - `anim` e' un oggetto MUTABILE ({ state, speed }) letto in useFrame: il controller lo
 *    aggiorna senza stato React. `speed` e' la velocita' orizzontale in m/s (~1.5 camminata,
 *    ~5 corsa) e regola frequenza e ampiezza del passo. Le animazioni sono indipendenti dal
 *    frame rate (damping con delta).
 *
 * COME SOSTITUIRLO CON UN GLB (senza toccare controller, camera o logica):
 *  1. Esporta il modello (origine ai piedi, +Z avanti, ~1.8 m) in `public/assets/models/tony.glb`.
 *     Opzionale: clip di animazione chiamati come gli stati: idle, walk, run, talk, gesture,
 *     interact, victory, pose (i mancanti ripiegano su `idle`).
 *  2. Imposta `TONY_MODEL_CONFIG.source = 'glb'` qui sotto (o cambia `glbUrl`).
 *  Fatto: l'export `TonyModel`, il tipo `TonyAnimSource` e il ritratto restano identici.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import {
  type AnimationAction,
  type BufferGeometry,
  type Group,
  type Mesh,
  LoopRepeat,
  MeshStandardMaterial,
} from 'three';
import { CylinderGeometry } from 'three';
import {
  type Part,
  type PartOpts,
  blob,
  box,
  cone,
  cyl,
  damp,
  limb,
  mergeParts,
  sphere,
  sphereArc,
  torus,
} from '@/world/geo';
import { matVCSmooth } from '@/world/materials';
import { makeTextTexture } from '@/world/textures';

export type TonyAnimState =
  'idle' | 'walk' | 'run' | 'talk' | 'gesture' | 'interact' | 'victory' | 'pose';
export type TonyAnimSource = { state: TonyAnimState; speed: number };

export const TONY_MODEL_CONFIG = {
  source: 'procedural' as 'procedural' | 'glb',
  glbUrl: '/assets/models/tony.glb',
  portraitUrl: '/assets/tony/portrait.jpg',
};

// --- palette di Tony (dalle foto: bomber in raso teal, barba scura, jeans, sneakers bianche) ---
const SKIN = '#e0b394';
const SKIN_SHADE = '#cf9c7c';
const BEARD = '#3a2e29';
const HAIR = '#241d1a';
const JACKET = '#4ea5a6';
const NAVY = '#1d2a4d';
const ORANGE = '#e8873a';
const CREAM = '#f2efe8';
const JEANS = '#27324a';
const JEANS_LIGHT = '#33425f';
const SNEAKER = '#f4f2ee';
const SOLE = '#c9c6bf';

// quote (m)
const HIP_Y = 0.9;
const THIGH = 0.45;
const SHIN = 0.37;
const SHOULDER_Y = 0.5; // sopra la vita
const NECK_Y = 0.56;
const HEAD_CY = 0.2; // centro cranio sopra il pivot del collo
const UPPER_ARM = 0.3;
const FOREARM = 0.27;

// --------------------------------------------------------------------------------------
// Geometrie (fuse con vertex color: pochi draw call)
// --------------------------------------------------------------------------------------
export interface TonyGeometries {
  hips: BufferGeometry;
  thigh: BufferGeometry;
  shin: BufferGeometry;
  torso: BufferGeometry;
  upperArm: BufferGeometry;
  forearm: BufferGeometry;
  head: BufferGeometry;
  mouth: BufferGeometry;
  backText: BufferGeometry;
}

/** Geometrie procedurali di Tony (esportata per i test sulla forma dei capelli). */
export function buildTony(): TonyGeometries {
  // bacino
  const hips = mergeParts([sphere(0.18, JEANS, { pos: [0, 0, 0], scale: [1.15, 0.8, 0.86] }, 10)]);

  // coscia (pivot all'anca, scende lungo -y)
  const thigh = mergeParts([
    limb([0, 0, 0], [0, -THIGH, 0], 0.092, 0.07, JEANS, {}, 7),
    sphere(0.09, JEANS, { pos: [0, 0, 0] }, 7),
  ]);
  // stinco + sneaker (pivot al ginocchio)
  const shin = mergeParts([
    limb([0, 0, 0], [0, -SHIN, 0], 0.07, 0.058, JEANS_LIGHT, {}, 7),
    cyl(0.062, 0.062, 0.03, '#1f283d', { pos: [0, -SHIN + 0.03, 0] }, 7), // risvolto
    // sneaker bianca
    sphere(0.075, SNEAKER, { pos: [0, -SHIN - 0.025, 0.055], scale: [0.95, 0.72, 1.85] }, 8),
    box(0.105, 0.03, 0.27, SOLE, { pos: [0, -SHIN - 0.06, 0.06] }),
    box(0.085, 0.012, 0.06, '#d8d4cb', { pos: [0, -SHIN + 0.002, 0.045] }),
  ]);

  // busto: bomber teal con colletto e fascia in costina a righe
  const torsoParts: Part[] = [
    cyl(
      0.2,
      0.19,
      0.5,
      JACKET,
      { pos: [0, 0.27, 0], scale: [1.2, 1, 0.8], gradient: [0.86, 1.08] },
      12,
    ),
    sphere(0.2, JACKET, { pos: [0, 0.52, 0], scale: [1.2, 0.36, 0.8] }, 12),
    // spalle
    sphere(0.072, JACKET, { pos: [0.225, 0.47, 0] }, 8),
    sphere(0.072, JACKET, { pos: [-0.225, 0.47, 0] }, 8),
    // fascia in costina (blu notte con riga arancio e bianca)
    cyl(0.2, 0.197, 0.07, NAVY, { pos: [0, 0.035, 0], scale: [1.2, 1, 0.8] }, 12),
    cyl(0.2025, 0.2025, 0.012, ORANGE, { pos: [0, 0.06, 0], scale: [1.2, 1, 0.8] }, 12),
    // colletto a coste con righe arancio / bianca / blu notte
    torus(0.085, 0.026, NAVY, { pos: [0, 0.585, 0], rot: [Math.PI / 2, 0, 0] }, 6, 14),
    torus(0.088, 0.012, CREAM, { pos: [0, 0.605, 0], rot: [Math.PI / 2, 0, 0] }, 5, 14),
    torus(0.092, 0.011, ORANGE, { pos: [0, 0.62, 0], rot: [Math.PI / 2, 0, 0] }, 5, 14),
    // cerniera / lembi anteriori e cuciture
    // collo (visibile sotto la testa)
    cyl(0.055, 0.06, 0.1, SKIN_SHADE, { pos: [0, 0.6, 0] }, 7),
    // patch sulla manica sinistra (omaggio alla foto)
  ];
  const torso = mergeParts(torsoParts);

  // braccio: spalla -> gomito (pivot alla spalla) e avambraccio con polsino a righe e mano
  const upperArm = mergeParts([
    limb([0, 0, 0], [0, -UPPER_ARM, 0], 0.062, 0.056, JACKET, { gradient: [0.9, 1.05] }, 8),
    sphere(0.058, JACKET, { pos: [0, -UPPER_ARM, 0] }, 7),
  ]);
  const forearm = mergeParts([
    limb([0, 0, 0], [0, -FOREARM + 0.03, 0], 0.06, 0.052, JACKET, {}, 8),
    cyl(0.053, 0.053, 0.03, NAVY, { pos: [0, -FOREARM + 0.025, 0] }, 8),
    cyl(0.0545, 0.0545, 0.008, ORANGE, { pos: [0, -FOREARM + 0.043, 0] }, 8),
    sphere(0.05, SKIN, { pos: [0, -FOREARM - 0.02, 0.005], scale: [0.85, 1.1, 0.7] }, 8),
    sphere(0.02, SKIN, { pos: [0.03, -FOREARM - 0.015, 0.03] }, 5), // pollice
  ]);

  // testa stilizzata (NIENTE texture fotografica): barba corta, sopracciglia folte, naso importante
  const H: Part[] = [];
  const cy = HEAD_CY;
  H.push(sphere(0.152, SKIN, { pos: [0, cy, 0], scale: [0.96, 1.1, 1.0] }, 14));
  H.push(sphere(0.07, SKIN, { pos: [0, cy - 0.1, 0.07], scale: [1.35, 0.8, 0.9] }, 8)); // mandibola
  // barba: guscio sulla meta' inferiore anteriore del volto + basette
  H.push(
    sphereArc(
      0.158,
      BEARD,
      [0, Math.PI, Math.PI * 0.58, Math.PI * 0.36],
      {
        pos: [0, cy, 0],
        scale: [0.99, 1.12, 1.03],
      },
      14,
    ),
  );
  H.push(sphere(0.058, BEARD, { pos: [0, cy - 0.145, 0.065], scale: [1.35, 0.7, 0.9] }, 8)); // mento
  for (const sx of [-1, 1]) {
    H.push(sphere(0.05, BEARD, { pos: [sx * 0.138, cy - 0.02, 0.02], scale: [0.45, 1.5, 0.9] }, 7)); // basette
    H.push(
      sphere(0.052, BEARD, { pos: [sx * 0.085, cy - 0.085, 0.105], scale: [0.9, 0.8, 0.7] }, 7),
    ); // guance
  }
  // baffi
  H.push(box(0.1, 0.022, 0.02, BEARD, { pos: [0, cy - 0.065, 0.15], rot: [0.15, 0, 0] }));
  H.push(sphere(0.03, BEARD, { pos: [-0.04, cy - 0.065, 0.145], scale: [1.5, 0.6, 0.7] }, 5));
  H.push(sphere(0.03, BEARD, { pos: [0.04, cy - 0.065, 0.145], scale: [1.5, 0.6, 0.7] }, 5));
  // naso pronunciato
  H.push(
    cone(0.038, 0.12, SKIN, { pos: [0, cy - 0.005, 0.158], rot: [Math.PI / 2 + 0.3, 0, 0] }, 5),
  );
  H.push(sphere(0.03, SKIN_SHADE, { pos: [0, cy - 0.04, 0.17], scale: [1.2, 0.9, 1] }, 6));
  // orecchie
  for (const sx of [-1, 1]) {
    H.push(
      sphere(0.04, SKIN_SHADE, { pos: [sx * 0.15, cy - 0.01, 0], scale: [0.5, 1.05, 0.85] }, 6),
    );
  }
  // occhi socchiusi, sopracciglia folte e un po' corrucciate
  for (const sx of [-1, 1]) {
    H.push(
      sphere(0.029, '#f6f4ee', { pos: [sx * 0.058, cy + 0.035, 0.128], scale: [1.1, 0.8, 0.6] }, 7),
    );
    H.push(sphere(0.0165, '#2a1d17', { pos: [sx * 0.058, cy + 0.033, 0.139] }, 6));
    H.push(
      box(0.082, 0.03, 0.026, '#1b1514', {
        pos: [sx * 0.06, cy + 0.075, 0.133],
        rot: [0.1, 0, sx * -0.22],
      }),
    ); // sopracciglio folto
    H.push(box(0.07, 0.014, 0.02, SKIN_SHADE, { pos: [sx * 0.058, cy + 0.052, 0.135] })); // palpebra pesante
  }
  // capelli (rif. over-shoulder.jpg): ai lati e dietro scuri e CORTI, sopra piu' lunghi e
  // spettinati, ciuffo morbido portato all'indietro (niente chignon, niente punte verticali).
  // Il guscio e' diviso in tre calotte adiacenti (fronte / lati / nuca) con raggio appena
  // sopra il cranio; la fronte resta libera sotto l'attaccatura (theta < 0.27 pi).
  const hairOpts: PartOpts = { pos: [0, cy + 0.004, -0.004], scale: [0.98, 1.12, 1.02] };
  const FRONT_HALF = 1.0; // semi-ampiezza (rad) del settore frontale attorno a +Z
  const sideStart = Math.PI / 2 + FRONT_HALF;
  const sideLen = Math.PI * 2 - 2 * FRONT_HALF;
  H.push(
    sphereArc(
      0.157,
      HAIR,
      [Math.PI / 2 - FRONT_HALF, 2 * FRONT_HALF, 0, Math.PI * 0.27],
      hairOpts,
      14,
    ),
  ); // attaccatura
  H.push(sphereArc(0.157, HAIR, [sideStart, sideLen, 0, Math.PI * 0.46], hairOpts, 14)); // lati e dietro, corti
  H.push(
    sphereArc(
      0.157,
      HAIR,
      [Math.PI + 0.6, Math.PI - 1.2, Math.PI * 0.46, Math.PI * 0.22],
      hairOpts,
      14,
    ),
  ); // nuca
  // massa piu' lunga sopra: volume morbido e appiattito, spinto all'indietro
  H.push(blob(0.1, HAIR, { pos: [0, cy + 0.148, -0.01], scale: [1.0, 0.5, 1.35] }, 1));
  H.push(
    blob(
      0.07,
      HAIR,
      { pos: [0.01, cy + 0.13, 0.07], rot: [-0.3, 0, 0], scale: [1.2, 0.55, 1.0] },
      1,
    ),
  ); // ciuffo frontale
  H.push(blob(0.07, HAIR, { pos: [0, cy + 0.13, -0.09], scale: [1.1, 0.6, 1.2] }, 1)); // volume dietro
  // qualche ciocca spettinata, bassa e inclinata all'indietro (mai dritta verso l'alto)
  for (const [x, y, z, rx, rz] of [
    [0.06, 0.17, -0.02, -1.2, -0.5],
    [-0.05, 0.17, 0.02, -1.1, 0.6],
    [0.02, 0.18, 0.06, -0.9, 0.1],
  ] as const) {
    H.push(cone(0.022, 0.075, HAIR, { pos: [x, cy + y, z], rot: [rx, 0, rz] }, 4));
  }
  // occhiali da sole appoggiati sulla testa, sul ciuffo (come in foto), stanghette bianche
  for (const sx of [-1, 1]) {
    H.push(
      box(0.075, 0.014, 0.05, '#101113', {
        pos: [sx * 0.05, cy + 0.205, -0.04],
        rot: [0.15, 0, sx * -0.05],
      }),
    );
    H.push(
      limb(
        [sx * 0.088, cy + 0.2, -0.05],
        [sx * 0.108, cy + 0.14, -0.03],
        0.007,
        0.007,
        '#f2f2f2',
        {},
        3,
      ),
    );
  }
  H.push(box(0.03, 0.01, 0.014, '#101113', { pos: [0, cy + 0.208, -0.04] }));

  // bocca (mesh separata: si anima durante il parlato)
  const mouth = mergeParts([sphere(0.026, '#6e2a2a', { scale: [1.5, 1, 0.5] }, 6)]);

  // scritta sulla schiena: patch curva (arco di cilindro che combacia col busto)
  const backGeo = new CylinderGeometry(
    0.2 * 1.004,
    0.2 * 1.004,
    0.2,
    14,
    1,
    true,
    Math.PI - 0.8,
    1.6,
  );

  return {
    hips,
    thigh,
    shin,
    torso,
    upperArm,
    forearm,
    head: mergeParts(H),
    mouth,
    backText: backGeo,
  };
}

// --------------------------------------------------------------------------------------
// Animazione procedurale
// --------------------------------------------------------------------------------------
const STATES: readonly TonyAnimState[] = [
  'idle',
  'walk',
  'run',
  'talk',
  'gesture',
  'interact',
  'victory',
  'pose',
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function TonyProcedural({ anim }: { anim: TonyAnimSource }) {
  const geos = useMemo(() => buildTony(), []);
  const jacketTex = useMemo(
    () =>
      makeTextTexture({
        lines: ['Piazzetta'],
        width: 512,
        height: 128,
        bg: JACKET,
        fg: '#f4efe6',
        outline: ORANGE,
        italic: true,
        weight: '700',
        fontFamily: '"Brush Script MT", "Segoe Script", "Apple Chancery", cursive',
        transparent: true,
      }),
    [],
  );
  const backMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: jacketTex,
        transparent: true,
        roughness: 0.55,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [jacketTex],
  );
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      jacketTex.dispose();
      backMat.dispose();
    },
    [geos, jacketTex, backMat],
  );

  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const chest = useRef<Group>(null);
  const head = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const elbowL = useRef<Group>(null);
  const elbowR = useRef<Group>(null);
  const mouth = useRef<Mesh>(null);

  // stato dell'animazione (nessuna allocazione per frame)
  const st = useRef({
    t: 0,
    phase: 0,
    gait: 0,
    w: {
      idle: 1,
      walk: 0,
      run: 0,
      talk: 0,
      gesture: 0,
      interact: 0,
      victory: 0,
      pose: 0,
    } as Record<TonyAnimState, number>,
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const B = body.current;
    const T = torso.current;
    const C = chest.current;
    const H = head.current;
    const HL = hipL.current;
    const HR = hipR.current;
    const KL = kneeL.current;
    const KR = kneeR.current;
    const AL = armL.current;
    const AR = armR.current;
    const EL = elbowL.current;
    const ER = elbowR.current;
    const M = mouth.current;
    if (!B || !T || !C || !H || !HL || !HR || !KL || !KR || !AL || !AR || !EL || !ER || !M) return;

    const s = st.current;
    s.t += dt;
    const t = s.t;
    const state = anim.state;
    const speed = Math.max(0, anim.speed);

    // pesi di stato smorzati (transizioni morbide)
    for (const name of STATES) {
      const target = name === state ? 1 : 0;
      s.w[name] = damp(s.w[name], target, 9, dt);
    }
    const W = s.w;
    const moving = state === 'walk' || state === 'run';
    // intensita' del passo in funzione della velocita' reale
    const gaitTarget = moving ? clamp01(speed / 1.4) : 0;
    s.gait = damp(s.gait, gaitTarget, 10, dt);
    const G = s.gait;
    const R = clamp01(W.run / Math.max(0.001, W.run + W.walk));
    const Rm = moving ? R : 0;
    s.phase += dt * (3.4 + speed * 2.6) * G;
    const sn = Math.sin(s.phase);
    const cs = Math.cos(s.phase);

    const legAmp = (0.5 + 0.4 * Rm) * G;
    const kneeAmp = (0.5 + 0.8 * Rm) * G;
    const armAmp = (0.42 + 0.5 * Rm) * G;
    const breath = Math.sin(t * 1.7);
    const talkAmt = clamp01(W.talk + W.gesture * 0.9);

    // ---------- base: idle / camminata / corsa ----------
    HL.rotation.x = -sn * legAmp;
    HR.rotation.x = sn * legAmp;
    HL.rotation.z = 0;
    HR.rotation.z = 0;
    KL.rotation.x = Math.max(0, cs) * kneeAmp + 0.02;
    KR.rotation.x = Math.max(0, -cs) * kneeAmp + 0.02;
    AL.rotation.x = sn * armAmp + Math.sin(t * 1.25) * 0.025 * (1 - G);
    AR.rotation.x = -sn * armAmp + Math.sin(t * 1.25 + 1.6) * 0.025 * (1 - G);
    AL.rotation.z = 0.07 + breath * 0.012;
    AR.rotation.z = -0.07 - breath * 0.012;
    AL.rotation.y = 0;
    AR.rotation.y = 0;
    EL.rotation.x = -(0.16 * G + 1.1 * Rm * G) - 0.12;
    ER.rotation.x = -(0.16 * G + 1.1 * Rm * G) - 0.12;
    EL.rotation.z = 0;
    ER.rotation.z = 0;
    B.position.y = Math.abs(cs) * (0.022 + 0.04 * Rm) * G;
    B.rotation.x = (0.03 + 0.15 * Rm) * G;
    B.rotation.z = 0;
    T.rotation.y = sn * (0.1 + 0.1 * Rm) * G;
    T.rotation.x = 0;
    T.rotation.z = 0;
    H.rotation.x = Math.sin(t * 0.7) * 0.02 - (0.03 + 0.1 * Rm) * G;
    H.rotation.y = -T.rotation.y * 0.6;
    H.rotation.z = Math.sin(t * 0.45) * 0.025;
    // respiro
    C.scale.set(1 + breath * 0.012, 1 + breath * 0.018, 1 + breath * 0.014);
    M.scale.set(1, 0.35, 1);

    // ---------- talk ----------
    if (W.talk > 0.002) {
      const k = W.talk;
      H.rotation.x += Math.sin(t * 5.2) * 0.05 * k;
      H.rotation.y += Math.sin(t * 1.7) * 0.14 * k;
      AR.rotation.x += (-0.55 + Math.sin(t * 2.6) * 0.25) * k;
      AR.rotation.z += -0.18 * k;
      ER.rotation.x += (-0.85 + Math.sin(t * 3.3) * 0.3) * k;
      AL.rotation.x += Math.sin(t * 2.1 + 1) * 0.1 * k;
      T.rotation.y += Math.sin(t * 1.3) * 0.08 * k;
    }
    // ---------- gesture: gesticolazione teatrale ----------
    if (W.gesture > 0.002) {
      const k = W.gesture;
      AR.rotation.x += (-1.15 + Math.sin(t * 3.1) * 0.5) * k;
      AR.rotation.z += (-0.55 + Math.sin(t * 2.3 + 1) * 0.3) * k;
      ER.rotation.x += (-0.6 + Math.sin(t * 3.7) * 0.5) * k;
      AL.rotation.x += (-0.9 + Math.sin(t * 2.7 + 2) * 0.5) * k;
      AL.rotation.z += (0.45 + Math.sin(t * 2.1) * 0.3) * k;
      EL.rotation.x += (-0.7 + Math.sin(t * 3.3 + 1) * 0.4) * k;
      T.rotation.y += Math.sin(t * 1.9) * 0.28 * k;
      B.rotation.z += Math.sin(t * 1.3) * 0.045 * k;
      B.rotation.x += 0.05 * k;
      H.rotation.y += Math.sin(t * 1.9 + 0.6) * 0.22 * k;
      H.rotation.z += Math.sin(t * 2.4) * 0.09 * k;
      B.position.y += Math.abs(Math.sin(t * 3.1)) * 0.015 * k;
    }
    // ---------- interact: allunga la mano ----------
    if (W.interact > 0.002) {
      const k = W.interact;
      AR.rotation.x += (-1.4 + Math.sin(t * 6) * 0.04) * k;
      AR.rotation.z += -0.08 * k;
      B.rotation.x += 0.12 * k;
      T.rotation.y += -0.18 * k;
      H.rotation.x += 0.1 * k;
      HL.rotation.x += -0.12 * k;
      HR.rotation.x += 0.18 * k;
      KR.rotation.x += 0.08 * k;
    }
    // ---------- victory: braccia in alto + saltello ----------
    if (W.victory > 0.002) {
      const k = W.victory;
      const hop = Math.abs(Math.sin(t * 6.5));
      AL.rotation.x += (-2.85 + Math.sin(t * 13) * 0.12) * k;
      AR.rotation.x += (-2.85 + Math.sin(t * 13 + 1.3) * 0.12) * k;
      AL.rotation.z += 0.3 * k;
      AR.rotation.z += -0.3 * k;
      EL.rotation.x += 0.1 * k;
      ER.rotation.x += 0.1 * k;
      B.position.y += hop * 0.2 * k;
      KL.rotation.x += (1 - hop) * 0.5 * k;
      KR.rotation.x += (1 - hop) * 0.5 * k;
      HL.rotation.x += -(1 - hop) * 0.25 * k;
      HR.rotation.x += -(1 - hop) * 0.25 * k;
      H.rotation.x += -0.12 * k;
      H.rotation.z += Math.sin(t * 6.5) * 0.08 * k;
      T.rotation.y += Math.sin(t * 3.2) * 0.2 * k;
    }
    // ---------- pose: posa comica da menu (mano sul fianco + pollice su) ----------
    if (W.pose > 0.002) {
      const k = W.pose;
      AL.rotation.z += 0.95 * k;
      EL.rotation.z += -1.55 * k;
      EL.rotation.x += -0.1 * k;
      AR.rotation.x += -2.1 * k;
      AR.rotation.z += -0.45 * k;
      ER.rotation.x += -0.6 * k;
      B.rotation.z += -0.07 * k;
      HL.rotation.z += 0.04 * k;
      HR.rotation.x += -0.3 * k;
      HL.rotation.x += 0.1 * k;
      KR.rotation.x += 0.15 * k;
      T.rotation.y += -0.3 * k;
      T.rotation.z += 0.05 * k;
      H.rotation.y += -0.28 * k;
      H.rotation.z += 0.12 * k;
      H.rotation.x += -0.06 * k;
      C.scale.x += 0.03 * k;
      C.scale.y += 0.03 * k;
    }

    // bocca che si muove quando parla/gesticola
    if (talkAmt > 0.01) {
      const open = Math.abs(Math.sin(t * 12.5)) * 0.65 + Math.abs(Math.sin(t * 7.1)) * 0.35;
      M.scale.y = 0.35 + open * 1.1 * talkAmt;
    }
  });

  const shoulderX = 0.245;
  const hipX = 0.1;
  return (
    <group ref={root}>
      <group ref={body}>
        {/* anche */}
        <group position={[0, HIP_Y, 0]}>
          <mesh geometry={geos.hips} material={matVCSmooth} castShadow />
        </group>
        <group ref={hipL} position={[hipX, HIP_Y, 0]}>
          <mesh geometry={geos.thigh} material={matVCSmooth} castShadow />
          <group ref={kneeL} position={[0, -THIGH, 0]}>
            <mesh geometry={geos.shin} material={matVCSmooth} castShadow />
          </group>
        </group>
        <group ref={hipR} position={[-hipX, HIP_Y, 0]}>
          <mesh geometry={geos.thigh} material={matVCSmooth} castShadow />
          <group ref={kneeR} position={[0, -THIGH, 0]}>
            <mesh geometry={geos.shin} material={matVCSmooth} castShadow />
          </group>
        </group>

        {/* busto: pivot alla vita */}
        <group ref={torso} position={[0, HIP_Y, 0]}>
          <group ref={chest}>
            <mesh geometry={geos.torso} material={matVCSmooth} castShadow />
            {/* scritta inventata "Piazzetta" sulla schiena della giacca */}
            <group scale={[1.2, 1, 0.8]} position={[0, 0.33, 0]}>
              <mesh geometry={geos.backText} material={backMat} />
            </group>
          </group>
          <group ref={armL} position={[shoulderX, SHOULDER_Y - 0.03, 0]}>
            <mesh geometry={geos.upperArm} material={matVCSmooth} castShadow />
            <group ref={elbowL} position={[0, -UPPER_ARM, 0]}>
              <mesh geometry={geos.forearm} material={matVCSmooth} castShadow />
            </group>
          </group>
          <group ref={armR} position={[-shoulderX, SHOULDER_Y - 0.03, 0]}>
            <mesh geometry={geos.upperArm} material={matVCSmooth} castShadow />
            <group ref={elbowR} position={[0, -UPPER_ARM, 0]}>
              <mesh geometry={geos.forearm} material={matVCSmooth} castShadow />
            </group>
          </group>
          {/* testa: pivot al collo */}
          <group ref={head} position={[0, NECK_Y, 0]}>
            <mesh geometry={geos.head} material={matVCSmooth} castShadow />
            <mesh
              ref={mouth}
              geometry={geos.mouth}
              material={matVCSmooth}
              position={[0, HEAD_CY - 0.095, 0.148]}
            />
          </group>
        </group>
      </group>
    </group>
  );
}

// --------------------------------------------------------------------------------------
// Variante GLB (opzionale): mappa gli stati sui clip omonimi con crossfade
// --------------------------------------------------------------------------------------
function TonyGlb({ anim }: { anim: TonyAnimSource }) {
  const gltf = useGLTF(TONY_MODEL_CONFIG.glbUrl);
  const group = useRef<Group>(null);
  const { actions } = useAnimations(gltf.animations, group);
  const current = useRef<AnimationAction | null>(null);
  const lastState = useRef<TonyAnimState | null>(null);

  useFrame(() => {
    if (lastState.current === anim.state) return;
    lastState.current = anim.state;
    const next = actions[anim.state] ?? actions.idle ?? null;
    if (!next || next === current.current) return;
    next.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.2).play();
    current.current?.fadeOut(0.2);
    current.current = next;
  });

  useEffect(() => {
    const clipNames = Object.keys(actions);
    return () => {
      for (const n of clipNames) actions[n]?.stop();
    };
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export function TonyModel({ anim }: { anim: TonyAnimSource }) {
  return TONY_MODEL_CONFIG.source === 'glb' ? (
    <TonyGlb anim={anim} />
  ) : (
    <TonyProcedural anim={anim} />
  );
}
