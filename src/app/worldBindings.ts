// OWNER: Architecture
// UNICO punto in cui l'app importa i moduli di World&3D: se i percorsi/firme di World cambiano,
// si corregge solo qui. Firme concordate:
//   Piazza(): JSX.Element                       (solo visivo)
//   PIAZZA_COLLIDERS: readonly ColliderShape[]  PIAZZA_POINTS (spawn, npcArea, bike, stationExit, stands, sparane)
//   Lighting({ quality: 'high' | 'low' })
//   Bicycle = forwardRef<Group, { wobble?: number }>
export { Piazza } from '@/world/environments/Piazza';
export { PIAZZA_COLLIDERS, PIAZZA_POINTS } from '@/world/environments/piazzaColliders';
export { Lighting } from '@/world/lighting/Lighting';
export { Bicycle } from '@/world/props/Bicycle';
