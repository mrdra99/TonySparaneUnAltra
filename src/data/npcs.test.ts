import { content } from '@/data';
import { NPC_COLLIDER_RADIUS } from '@/game/core/constants';
import { overlapsAny } from '@/game/core/collision';
import { PIAZZA_COLLIDERS, PIAZZA_POINTS } from '@/world/environments/piazzaColliders';

describe('cast della piazza', () => {
  it('ha id univoci, nomi e dialoghi', () => {
    const ids = content.npcs.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of content.npcs) {
      expect(n.name.length).toBeGreaterThan(1);
      expect(n.dialogueId).toBeTruthy();
    }
  });

  it('gli NPC maschi guardano Tony, le femmine no', () => {
    for (const n of content.npcs) expect(n.watchesTony).toBe(n.gender === 'male');
  });

  it('nessun NPC (in piedi) e dentro un collider statico', () => {
    for (const n of content.npcs.filter((x) => x.idleBehaviour !== 'sit')) {
      const [x, z] = n.position;
      expect(
        overlapsAny(x, z, n.colliderRadius ?? NPC_COLLIDER_RADIUS, PIAZZA_COLLIDERS),
        `${n.id} in [${x}, ${z}]`,
      ).toBe(false);
    }
  });

  it('gli NPC non coprono lo spawn di Tony', () => {
    const [sx, sz] = PIAZZA_POINTS.spawn;
    for (const n of content.npcs) {
      expect(Math.hypot(n.position[0] - sx, n.position[1] - sz)).toBeGreaterThan(2);
    }
  });
});
