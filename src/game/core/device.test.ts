import {
  QUALITY_PRESETS,
  detectDeviceProfile,
  resolveDeviceProfile,
  resolveQuality,
  type DeviceEnv,
} from './device';

const desktop: DeviceEnv = {
  pointerCoarse: false,
  hoverNone: false,
  maxTouchPoints: 0,
  width: 1920,
  height: 1080,
};
const phonePortrait: DeviceEnv = {
  pointerCoarse: true,
  hoverNone: true,
  maxTouchPoints: 5,
  width: 390,
  height: 844,
};

describe('device profile', () => {
  it('desktop: no touch, landscape, quality high', () => {
    const p = detectDeviceProfile(desktop);
    expect(p).toMatchObject({
      isTouch: false,
      orientation: 'landscape',
      isSmallViewport: false,
      detectedQuality: 'high',
    });
  });
  it('smartphone portrait: touch, small, low', () => {
    const p = detectDeviceProfile(phonePortrait);
    expect(p).toMatchObject({
      isTouch: true,
      orientation: 'portrait',
      isSmallViewport: true,
      detectedQuality: 'low',
    });
  });
  it('tablet touch grande resta low (touch)', () => {
    const p = detectDeviceProfile({ ...phonePortrait, width: 1024, height: 768 });
    expect(p.isSmallViewport).toBe(false);
    expect(p.detectedQuality).toBe('low');
  });
  it('portatile con touchscreen ma mouse/hover = desktop', () => {
    const p = detectDeviceProfile({ ...desktop, maxTouchPoints: 10 });
    expect(p.isTouch).toBe(false);
  });
  it('viewport 360 landscape e piccolo', () => {
    const p = detectDeviceProfile({ ...phonePortrait, width: 740, height: 360 });
    expect(p).toMatchObject({ orientation: 'landscape', isSmallViewport: true });
  });
  it('override utente della qualita', () => {
    const detected = detectDeviceProfile(phonePortrait);
    expect(resolveQuality('auto', 'low')).toBe('low');
    expect(resolveQuality('high', 'low')).toBe('high');
    const forced = resolveDeviceProfile(detected, 'high');
    expect(forced.qualityProfile).toBe('high');
    expect(forced.preset).toBe(QUALITY_PRESETS.high);
    expect(resolveDeviceProfile(detected, 'auto').preset.dprMax).toBe(1.25);
    expect(QUALITY_PRESETS.low.ambientOcclusion).toBe(false);
    expect(QUALITY_PRESETS.low.shadowMapSize).toBeLessThan(QUALITY_PRESETS.high.shadowMapSize);
  });
});
