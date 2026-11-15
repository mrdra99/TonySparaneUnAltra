/** Dialogo di prova per i test UI: indipendente dai dati reali, che Gameplay riscrive. */
import { content } from '@/data';
import { DIALOGUE_END, type Dialogue } from '@/game/core/types';

export const UI_TEST_DIALOGUE: Dialogue = {
  id: 'marco-cinque-euro',
  start: 'ask',
  repeatStart: 'again',
  nodes: {
    ask: {
      id: 'ask',
      speaker: 'marco',
      mood: 'smug',
      text: 'Oh Tony, ma alla fine quei cinque euro?',
      choices: [
        { text: 'Fra, te li do domani.', next: 'r1' },
        {
          text: 'Guarda che me li devi tu.',
          next: 'r2',
          effects: [
            { type: 'addCazzate', amount: 3, reason: 'Scusa improvvisata', onceId: 'marco-r2' },
          ],
        },
        {
          text: 'Non posso spiegarti, è una questione internazionale.',
          next: 'r3',
          effects: [{ type: 'addCazzate', amount: 5, reason: 'Storia minore', onceId: 'marco-r3' }],
        },
      ],
    },
    r1: {
      id: 'r1',
      speaker: 'marco',
      text: 'Domani, sempre domani. Ormai è un calendario a parte.',
      next: 'done',
    },
    r2: {
      id: 'r2',
      speaker: 'marco',
      mood: 'confused',
      text: 'Io a te? Aspetta che faccio i conti... no, aspetta, non li so fare.',
      next: 'done',
    },
    r3: {
      id: 'r3',
      speaker: 'marco',
      mood: 'shocked',
      text: 'Internazionale?! Ma i cinque euro sono rimasti a Viareggio?',
      next: 'done',
    },
    done: {
      id: 'done',
      speaker: 'tony',
      gesture: true,
      text: 'Oh fraaaa, ci vediamo.',
      effects: [{ type: 'completeObjective', missionId: 'ninna-canna', objectiveId: 'talk-marco' }],
      next: DIALOGUE_END,
    },
    again: {
      id: 'again',
      speaker: 'marco',
      text: 'Ancora tu? I cinque euro restano nel limbo, eh.',
      next: DIALOGUE_END,
    },
  },
};

/** Registra il dialogo di prova nel catalogo condiviso (idempotente). */
export function installUiTestDialogue(): void {
  (content.dialogues as Record<string, Dialogue>)[UI_TEST_DIALOGUE.id] = UI_TEST_DIALOGUE;
}
