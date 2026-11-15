import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { makeTextTexture } from '../textures';

interface SignProps {
  lines: readonly string[];
  bg: string;
  fg: string;
  width: number;
  height: number;
  position: readonly [number, number, number];
  /** Rotazione Y: la faccia con il testo guarda verso (sin, cos). */
  rotationY: number;
  /** Se true aggiunge due pali fino a terra. */
  posts?: boolean;
  italic?: boolean;
}

const frameMat = new MeshStandardMaterial({ color: '#2f3438', roughness: 0.7, flatShading: true });

/** Cartello con testo disegnato su canvas (niente font esterni). */
export function Sign({
  lines,
  bg,
  fg,
  width,
  height,
  position,
  rotationY,
  posts = false,
  italic = false,
}: SignProps) {
  const key = lines.join('|');
  const tex = useMemo(
    () =>
      makeTextTexture({
        lines: key.split('|'),
        width: 512,
        height: Math.round((512 * height) / width),
        bg,
        fg,
        border: fg,
        italic,
      }),
    [key, bg, fg, width, height, italic],
  );
  const mat = useMemo(() => new MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex]);
  useEffect(
    () => () => {
      tex.dispose();
      mat.dispose();
    },
    [tex, mat],
  );

  return (
    <group position={[position[0], position[1], position[2]]} rotation-y={rotationY}>
      <mesh material={frameMat} castShadow>
        <boxGeometry args={[width + 0.1, height + 0.1, 0.08]} />
      </mesh>
      <mesh material={mat} position={[0, 0, 0.042]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {posts &&
        [-1, 1].map((sx) => (
          <mesh
            key={sx}
            material={frameMat}
            position={[sx * (width / 2 - 0.2), -position[1] / 2, -0.02]}
            castShadow
          >
            <boxGeometry args={[0.1, position[1], 0.1]} />
          </mesh>
        ))}
    </group>
  );
}
