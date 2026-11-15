import { Sky } from '@react-three/drei';
import { PALETTE } from '../materials';

/** Direzione del sole: pomeriggio mediterraneo da sud-ovest, alto e caldo. */
const SUN: readonly [number, number, number] = [-14, 24, 16];

export function Lighting({ quality }: { quality: 'high' | 'low' }) {
  const mapSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.fog, 80, 220]} />
      <Sky
        distance={300}
        sunPosition={SUN as [number, number, number]}
        turbidity={1.6}
        rayleigh={1.1}
        mieCoefficient={0.003}
        mieDirectionalG={0.8}
      />
      <hemisphereLight args={['#cfe4ff', '#e0cfae', 1.35]} />
      <ambientLight intensity={0.12} color="#fff3e0" />
      <directionalLight
        castShadow
        position={SUN as [number, number, number]}
        intensity={2.6}
        color="#fff0d2"
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}
