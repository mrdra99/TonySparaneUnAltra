// OWNER: Finale. Colla della logica del livello (nessun output visivo): fa avanzare le tappe quando i flag
// le chiudono, scandisce il countdown dell'Intercity e chiude il K.O. tecnico. Le regole sono pure
// (logic/rules.ts, logic/ko.ts): qui ci sono solo timer e sottoscrizione allo store, con cleanup.
import { useEffect } from 'react';
import { gameStore } from '@/store/gameStore';
import { characterById } from './data/cast';
import { isFlashbackLevel } from './logic/ids';
import { KO_TIMELINE } from './logic/ko';
import { advanceStage } from './logic/rules';

/** Frequenza del countdown: una volta al secondo (nessun re-render per frame). */
const TICK_MS = 1000;

export function FinaleController() {
  // Countdown "Intercity in partenza": scorre solo mentre si gioca a Pisa (lo decide lo store).
  useEffect(() => {
    const id = window.setInterval(() => gameStore.getState().finaleTick(TICK_MS / 1000), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Avanzamento di tappa: appena il dialogo si chiude (fase 'playing') e il flag della tappa e' acceso.
  useEffect(() => {
    const check = (): void => {
      const s = gameStore.getState();
      if (s.phase !== 'playing' || s.levelTransition !== null || !isFlashbackLevel(s.level)) return;
      const next = advanceStage(s.level, s.progress.flags);
      if (next.kind === 'transition') {
        s.startLevelTransition(next.to);
      } else if (next.kind === 'ko') {
        const bogdan = characterById('bogdan-torre');
        s.startKo(bogdan ? bogdan.position : [0, 0]);
      }
    };
    check();
    return gameStore.subscribe(check);
  }, []);

  // Chiusura del K.O.: alla fine della timeline il Cazzatometro va a 100 (finale del gioco).
  useEffect(() => {
    let timer: number | null = null;
    let armedFor: number | null = null;
    const sync = (): void => {
      const at = gameStore.getState().finale.koStartedAt;
      if (at === armedFor) return;
      armedFor = at;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      if (at !== null) {
        const wait = Math.max(0, KO_TIMELINE.done - (Date.now() - at));
        timer = window.setTimeout(() => gameStore.getState().finishKo(), wait);
      }
    };
    sync();
    const unsubscribe = gameStore.subscribe(sync);
    return () => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
