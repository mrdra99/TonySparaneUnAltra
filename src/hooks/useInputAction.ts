/** OWNER: Architecture. Sottoscrive un'azione edge di input per la vita del componente. */
import { useEffect, useRef } from 'react';
import { input, type InputAction } from '@/game/core/input';

export function useInputAction(action: InputAction, handler: () => void): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => input.onAction(action, () => ref.current()), [action]);
}
