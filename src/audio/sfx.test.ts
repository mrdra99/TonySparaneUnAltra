import { applyAudioSettings, playSfx, resetAudioForTests, type SfxName } from './sfx';

const ALL: readonly SfxName[] = [
  'menuSelect',
  'dialogueStart',
  'missionComplete',
  'achievement',
  'cazzateUp',
  'finale',
  'ringBell',
  'stationChime',
  'taxiHorn',
  'blip',
];

/** AudioContext finto: conta gli oscillatori creati e simula lo stato running/suspended. */
function installFakeAudio(state: 'running' | 'suspended' = 'running') {
  const counters = { oscillators: 0, sources: 0, contexts: 0, resumed: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  });
  const node = () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn() });
  class FakeContext {
    state = state;
    currentTime = 0;
    sampleRate = 8000;
    destination = {};
    masterGain = param();
    constructor() {
      counters.contexts++;
    }
    createGain() {
      return { ...node(), gain: this.masterGain };
    }
    createOscillator() {
      counters.oscillators++;
      return { ...node(), type: 'sine', frequency: param() };
    }
    createBiquadFilter() {
      return { ...node(), type: 'lowpass', frequency: param(), Q: { value: 0 } };
    }
    createBufferSource() {
      counters.sources++;
      return { ...node(), buffer: null };
    }
    createBuffer(_c: number, length: number) {
      return { sampleRate: 8000, getChannelData: () => new Float32Array(length) };
    }
    resume() {
      counters.resumed++;
      this.state = 'running';
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  Object.defineProperty(window, 'AudioContext', { value: FakeContext, configurable: true });
  return counters;
}

describe('sfx', () => {
  afterEach(() => {
    resetAudioForTests();
    Reflect.deleteProperty(window, 'AudioContext');
  });

  it('e un no-op sicuro senza AudioContext (jsdom)', () => {
    for (const name of ALL) expect(() => playSfx(name)).not.toThrow();
    expect(() => applyAudioSettings({ volume: 0.5, muted: false })).not.toThrow();
  });

  it('non crea l AudioContext prima del primo gesto utente', () => {
    const counters = installFakeAudio();
    applyAudioSettings({ volume: 0.7, muted: false });
    playSfx('menuSelect');
    expect(counters.contexts).toBe(0);
    window.dispatchEvent(new Event('pointerdown'));
    expect(counters.contexts).toBe(1);
  });

  it('dopo un gesto produce suoni per ogni sfx', () => {
    const counters = installFakeAudio();
    applyAudioSettings({ volume: 0.7, muted: false });
    window.dispatchEvent(new Event('keydown'));
    for (const name of ALL.filter((n) => n !== 'blip')) {
      const before = counters.oscillators;
      playSfx(name);
      expect(counters.oscillators, name).toBeGreaterThan(before);
    }
  });

  it('muto o volume zero non suonano', () => {
    const counters = installFakeAudio();
    applyAudioSettings({ volume: 0.7, muted: true });
    window.dispatchEvent(new Event('keydown'));
    playSfx('finale');
    expect(counters.oscillators).toBe(0);
    applyAudioSettings({ volume: 0, muted: false });
    playSfx('finale');
    expect(counters.oscillators).toBe(0);
  });

  it('il blip e limitato (throttle)', () => {
    const counters = installFakeAudio();
    applyAudioSettings({ volume: 0.7, muted: false });
    window.dispatchEvent(new Event('keydown'));
    playSfx('blip');
    playSfx('blip');
    playSfx('blip');
    expect(counters.oscillators).toBe(1);
  });
});
