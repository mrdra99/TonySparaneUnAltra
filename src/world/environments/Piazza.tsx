// OWNER: World&3D
// TEMP STUB (Architecture): World lo sostituisce. Contratto: `export function Piazza(): JSX.Element`,
// SOLO visivo (i collider sono in piazzaColliders.ts e li registra l'app).
import { PIAZZA_BOUNDS, PIAZZA_COLLIDERS } from './piazzaColliders';

const WIDTH = PIAZZA_BOUNDS.maxX - PIAZZA_BOUNDS.minX;
const DEPTH = PIAZZA_BOUNDS.maxZ - PIAZZA_BOUNDS.minZ;

export function Piazza() {
  return (
    <group name="piazza-placeholder">
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial color="#c9c4b8" />
      </mesh>
      {PIAZZA_COLLIDERS.map((c, i) =>
        c.kind === 'box' ? (
          <mesh
            key={i}
            position={[(c.minX + c.maxX) / 2, 1, (c.minZ + c.maxZ) / 2]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[c.maxX - c.minX, 2, c.maxZ - c.minZ]} />
            <meshStandardMaterial color="#8d8a82" />
          </mesh>
        ) : (
          <mesh key={i} position={[c.x, 1, c.z]} castShadow receiveShadow>
            <cylinderGeometry args={[c.r, c.r, 2, 12]} />
            <meshStandardMaterial color="#5f7a4a" />
          </mesh>
        ),
      )}
    </group>
  );
}
