// OWNER: Gameplay
// Overlay DOM (un solo contenitore, pool di MAX_BUBBLES elementi) che proietta le nuvolette sulla
// posizione 3D degli NPC. Aggiornamento imperativo in useFrame: nessun setState per frame.
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { gameStore } from '@/store/gameStore';
import { bubbleSlots, clearBubbles, expireBubbles } from './speechBubbles';

const CONTAINER_CSS =
  'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:4;contain:strict;';
const BUBBLE_CSS =
  'position:absolute;left:0;top:0;display:none;max-width:210px;padding:6px 10px;border-radius:14px;' +
  'background:#fffdf6;color:#1d1a16;font:700 14px/1.25 system-ui,sans-serif;text-align:center;' +
  'box-shadow:0 2px 0 #1d1a16,0 4px 10px rgba(0,0,0,.25);border:2px solid #1d1a16;will-change:transform;';
const TAIL_CSS =
  'position:absolute;left:50%;bottom:-8px;width:10px;height:10px;margin-left:-5px;background:#fffdf6;' +
  'border-right:2px solid #1d1a16;border-bottom:2px solid #1d1a16;transform:rotate(45deg);';

interface Bubble {
  el: HTMLDivElement;
  textEl: HTMLSpanElement;
  version: number;
  shown: boolean;
}

export function SpeechBubbleLayer() {
  const gl = useThree((s) => s.gl);
  const scratch = useMemo(() => ({ v: new Vector3(), bubbles: [] as Bubble[] }), []);

  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    container.style.cssText = CONTAINER_CSS;
    scratch.bubbles = bubbleSlots.map(() => {
      const el = document.createElement('div');
      el.style.cssText = BUBBLE_CSS;
      const textEl = document.createElement('span');
      const tail = document.createElement('div');
      tail.style.cssText = TAIL_CSS;
      el.append(textEl, tail);
      container.append(el);
      return { el, textEl, version: -1, shown: false };
    });
    parent.append(container);
    return () => {
      container.remove();
      scratch.bubbles = [];
      clearBubbles();
    };
  }, [gl, scratch]);

  useFrame((state) => {
    const playing = gameStore.getState().phase === 'playing';
    const now = state.clock.elapsedTime;
    expireBubbles(now);
    const { width, height } = state.size;
    const v = scratch.v;
    for (let i = 0; i < scratch.bubbles.length; i++) {
      const b = scratch.bubbles[i];
      const s = bubbleSlots[i];
      if (!b || !s) continue;
      let visible = playing && s.active;
      if (visible) {
        v.set(s.x, s.y, s.z).project(state.camera);
        if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) visible = false;
      }
      if (!visible) {
        if (b.shown) {
          b.el.style.display = 'none';
          b.shown = false;
        }
        continue;
      }
      if (b.version !== s.version) {
        b.textEl.textContent = s.text;
        b.version = s.version;
      }
      if (!b.shown) {
        b.el.style.display = 'block';
        b.shown = true;
      }
      const px = (v.x * 0.5 + 0.5) * width;
      const py = (-v.y * 0.5 + 0.5) * height;
      b.el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%) translateY(-10px)`;
    }
  });

  return null;
}
