// OWNER: Architecture
// Composizione: canvas 3D sempre montato + overlay HTML. Ogni overlay si auto-gestisce la visibilita'
// leggendo lo store (restituisce null quando non pertinente): l'ordine qui sotto e' l'ordine z.
import { useEffect } from 'react';
import { attachKeyboard } from '@/game/core/input';
import { useGameStore } from '@/store/gameStore';
import { Hud } from '@/ui/hud/Hud';
import { DialoguePanel } from '@/ui/dialogues/DialoguePanel';
import { LoadingScreen } from '@/ui/LoadingScreen';
import { EndingScreen } from '@/ui/menus/EndingScreen';
import { LegendsLog } from '@/ui/menus/LegendsLog';
import { MainMenu } from '@/ui/menus/MainMenu';
import { MissionLog } from '@/ui/menus/MissionLog';
import { PauseMenu } from '@/ui/menus/PauseMenu';
import { Settings } from '@/ui/menus/Settings';
import { Notifications } from '@/ui/notifications/Notifications';
import { TouchControls } from '@/ui/touch/TouchControls';
import styles from './App.module.css';
import { GameCanvas } from './GameCanvas';
import { GlobalActions } from './GlobalActions';
import { PhaseTimers } from './PhaseTimers';

export function App() {
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);

  useEffect(() => attachKeyboard(window), []);

  useEffect(() => {
    document.documentElement.dataset['reducedMotion'] = String(reducedMotion);
  }, [reducedMotion]);

  return (
    <div className={styles.root}>
      <GameCanvas />
      <div className={styles.overlay}>
        <Hud />
        <TouchControls />
        <DialoguePanel />
        <Notifications />
        <MainMenu />
        <PauseMenu />
        <MissionLog />
        <LegendsLog />
        <Settings />
        <EndingScreen />
        <LoadingScreen />
      </div>
      <GlobalActions />
      <PhaseTimers />
    </div>
  );
}
