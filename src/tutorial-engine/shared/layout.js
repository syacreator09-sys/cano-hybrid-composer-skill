export const OUTPUT_PROFILES = Object.freeze({
  '9:16': Object.freeze({
    width: 1080,
    height: 1920,
    safeZones: Object.freeze({ top: 140, bottom: 300, left: 60, right: 60 })
  }),
  '16:9': Object.freeze({
    width: 1920,
    height: 1080,
    safeZones: Object.freeze({ top: 80, bottom: 120, left: 100, right: 100 })
  })
});

export function getOutputProfile(canvas = '9:16') {
  const profile = OUTPUT_PROFILES[canvas];
  if (!profile) throw new Error(`unsupported canvas: ${canvas}`);
  return profile;
}
