/**
 * Texture procedurali (canvas): nessun asset esterno, nessun font da CDN.
 */
import { CanvasTexture, SRGBColorSpace } from 'three';
import { makeRng } from './geo';

function makeCanvas(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponibile');
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement, anisotropy = 4): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export interface TextTextureOpts {
  lines: readonly string[];
  width: number;
  height: number;
  bg: string;
  fg: string;
  border?: string;
  fontFamily?: string;
  weight?: string;
  italic?: boolean;
  /** Se true lo sfondo e' trasparente. */
  transparent?: boolean;
  /** Ombra/contorno del testo. */
  outline?: string;
}

/** Cartello/scritta: il testo viene rimpicciolito finche' non sta nel riquadro. */
export function makeTextTexture(o: TextTextureOpts): CanvasTexture {
  const { canvas, ctx } = makeCanvas(o.width, o.height);
  if (!o.transparent) {
    ctx.fillStyle = o.bg;
    ctx.fillRect(0, 0, o.width, o.height);
  }
  if (o.border) {
    ctx.strokeStyle = o.border;
    ctx.lineWidth = Math.round(o.height * 0.05);
    const inset = ctx.lineWidth * 1.2;
    ctx.strokeRect(inset, inset, o.width - inset * 2, o.height - inset * 2);
  }
  const family = o.fontFamily ?? '"Trebuchet MS", "Segoe UI", Arial, sans-serif';
  const style = `${o.italic ? 'italic ' : ''}${o.weight ?? '700'}`;
  const lineCount = Math.max(1, o.lines.length);
  let size = (o.height * 0.7) / lineCount;
  const maxW = o.width * 0.88;
  const fits = (s: number) => {
    ctx.font = `${style} ${s}px ${family}`;
    return o.lines.every((l) => ctx.measureText(l).width <= maxW);
  };
  while (size > 8 && !fits(size)) size -= 2;
  ctx.font = `${style} ${size}px ${family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  o.lines.forEach((line, i) => {
    const y = o.height * ((i + 0.5) / lineCount) + size * 0.04;
    if (o.outline) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = o.outline;
      ctx.strokeText(line, o.width / 2, y);
    }
    ctx.fillStyle = o.fg;
    ctx.fillText(line, o.width / 2, y);
  });
  return finish(canvas, 8);
}

export const FLOOR_BOUNDS = { minX: -22, maxX: 22, minZ: -15.5, maxZ: 16.5 } as const;

/**
 * Pavimento della piazza: cemento chiaro con grana, giunti di dilatazione, tombini e
 * le celebri sgommate nere curve. Coordinate mondo -> pixel secondo FLOOR_BOUNDS.
 */
export function makePiazzaFloorTexture(W = 1760, H = 1280): CanvasTexture {
  const { canvas, ctx } = makeCanvas(W, H);
  const rng = makeRng(20240611);
  const sx = W / (FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX);
  const sz = H / (FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ);
  const px = (x: number) => (x - FLOOR_BOUNDS.minX) * sx;
  const pz = (z: number) => (z - FLOOR_BOUNDS.minZ) * sz;

  ctx.fillStyle = '#cbc4b5';
  ctx.fillRect(0, 0, W, H);

  // macchie larghe e tenui (cemento non uniforme)
  for (let i = 0; i < 90; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = 60 + rng() * 220;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = rng() < 0.5;
    g.addColorStop(0, dark ? 'rgba(120,112,98,0.09)' : 'rgba(255,250,236,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // grana fine
  for (let i = 0; i < 38000; i++) {
    const a = rng() * 0.07;
    ctx.fillStyle = rng() < 0.5 ? `rgba(70,64,54,${a})` : `rgba(255,252,242,${a})`;
    ctx.fillRect(rng() * W, rng() * H, 1 + rng() * 2.5, 1 + rng() * 2.5);
  }

  // giunti di dilatazione (lastre da ~5.5 m)
  ctx.strokeStyle = 'rgba(80,74,64,0.16)';
  ctx.lineWidth = 2;
  for (let x = -22; x <= 22; x += 5.5) {
    ctx.beginPath();
    ctx.moveTo(px(x), 0);
    ctx.lineTo(px(x), H);
    ctx.stroke();
  }
  for (let z = -15.5; z <= 16.5; z += 5.33) {
    ctx.beginPath();
    ctx.moveTo(0, pz(z));
    ctx.lineTo(W, pz(z));
    ctx.stroke();
  }

  // tombini
  const manholes: Array<[number, number]> = [
    [-3.5, -4.2],
    [6.5, 3.4],
    [-11.5, 6.8],
  ];
  for (const [mx, mz] of manholes) {
    ctx.fillStyle = 'rgba(70,66,60,0.55)';
    ctx.beginPath();
    ctx.arc(px(mx), pz(mz), 0.38 * sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(50,48,44,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // sgommate: tracce curve nere (doppia traccia leggermente sfalsata)
  const skid = (draw: () => void, width: number, alpha: number) => {
    for (const [ox, oz, a] of [
      [0, 0, 1],
      [0.22 * sx, 0.12 * sz, 0.75],
      [-0.1 * sx, 0.28 * sz, 0.45],
    ] as const) {
      ctx.save();
      ctx.translate(ox, oz);
      ctx.strokeStyle = `rgba(24,24,28,${alpha * a})`;
      ctx.lineWidth = width * (a === 1 ? 1 : 0.7);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      draw();
      ctx.stroke();
      ctx.restore();
    }
  };
  // spirale/anelli a sinistra
  for (const [cx, cz, rx, rz, a] of [
    [-9, 5.5, 4.6, 3.0, 0.5],
    [-8.4, 5.2, 3.7, 2.4, 0.55],
    [-7.9, 5.0, 2.8, 1.8, 0.5],
    [-9.6, 5.9, 5.4, 3.5, 0.32],
  ] as const) {
    skid(() => ctx.ellipse(px(cx), pz(cz), rx * sx, rz * sz, -0.2, 0.3, Math.PI * 2 + 0.1), 5.5, a);
  }
  // lunga S che attraversa il centro
  skid(
    () => {
      ctx.moveTo(px(-5.5), pz(7.4));
      ctx.bezierCurveTo(px(-1), pz(11), px(3), pz(3.2), px(8), pz(6.8));
      ctx.bezierCurveTo(px(12), pz(9.8), px(15.5), pz(8.8), px(16.2), pz(5.4));
    },
    6.2,
    0.55,
  );
  // arco largo verso il centro-destra
  skid(
    () => {
      ctx.moveTo(px(-2), pz(1.2));
      ctx.bezierCurveTo(px(2), pz(-1.5), px(7), pz(0.5), px(9), pz(3.2));
      ctx.bezierCurveTo(px(10), pz(5), px(8.2), pz(6.4), px(6.2), pz(5.2));
    },
    5,
    0.42,
  );
  // trattino corto vicino alla gradinata
  skid(
    () => {
      ctx.moveTo(px(-14), pz(-4.6));
      ctx.bezierCurveTo(px(-11), pz(-6.2), px(-8), pz(-5.8), px(-6.4), pz(-3.8));
    },
    4.5,
    0.3,
  );

  // macchie d'olio
  for (const [ox, oz, r] of [
    [3.2, 8.4, 0.9],
    [-1.5, -2.6, 0.7],
    [12, -3, 0.8],
  ] as const) {
    const g = ctx.createRadialGradient(px(ox), pz(oz), 0, px(ox), pz(oz), r * sx);
    g.addColorStop(0, 'rgba(60,56,52,0.22)');
    g.addColorStop(1, 'rgba(60,56,52,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px(ox) - r * sx, pz(oz) - r * sx, r * sx * 2, r * sx * 2);
  }

  const tex = finish(canvas, 8);
  return tex;
}
