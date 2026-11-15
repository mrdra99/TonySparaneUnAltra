// OWNER: Architecture
// Instrada le azioni di input GLOBALI ('pause', 'missions') verso lo store.
// 'interact' / 'advance' / 'choiceN' NON sono qui: li gestiscono InteractionSystem (fase playing)
// e DialoguePanel (fase dialogue, typewriter-aware).
import { useInputAction } from '@/hooks/useInputAction';
import { gameStore } from '@/store/gameStore';

export function GlobalActions() {
  useInputAction('pause', () => {
    const s = gameStore.getState();
    switch (s.phase) {
      case 'playing':
        s.pause();
        break;
      case 'dialogue':
        s.closeDialogue();
        break;
      case 'paused':
      case 'menu':
        s.closePanel();
        break;
      default:
        break;
    }
  });
  useInputAction('missions', () => gameStore.getState().toggleMissions());
  return null;
}
