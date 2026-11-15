// OWNER: World&3D
// TEMP STUB (Architecture): World lo sostituisce. Contratto: `Lighting({ quality }: { quality: 'high' | 'low' })`.
import { QUALITY_PRESETS } from '@/game/core/device';

export function Lighting({ quality }: { quality: 'high' | 'low' }) {
  const size = QUALITY_PRESETS[quality].shadowMapSize;
  return (
    <>
      <color attach="background" args={['#cfe3ee']} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[12, 20, 8]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[size, size]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
    </>
  );
}
