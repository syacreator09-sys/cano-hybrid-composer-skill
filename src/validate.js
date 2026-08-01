const TYPES = new Set(['avatar','browser','videovox','image','diagram','comparison','broll','result','title','chapter','cta']);
const FITS = new Set(['cover','contain']);

export function validateComposition(input) {
  const errors = [];
  if (!['1.0','1.1'].includes(input?.version)) errors.push('version must be 1.0 or 1.1');
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(input?.projectId ?? '')) errors.push('invalid projectId');
  if (!['9:16','16:9'].includes(input?.canvas)) errors.push('canvas must be 9:16 or 16:9');
  if (input?.fps !== undefined && !(Number(input.fps) >= 12 && Number(input.fps) <= 60)) errors.push('fps must be 12-60');
  if (!Array.isArray(input?.scenes) || !input.scenes.length) errors.push('scenes required');
  const ids = new Set();
  for (const [index, scene] of (input?.scenes ?? []).entries()) {
    if (!scene.id || ids.has(scene.id)) errors.push(`scenes[${index}].id must be unique`); else ids.add(scene.id);
    if (!TYPES.has(scene.type)) errors.push(`scenes[${index}].type unsupported`);
    if (!(Number(scene.duration) > 0 && Number(scene.duration) <= 3600)) errors.push(`scenes[${index}].duration must be 0-3600`);
    if (!scene.asset && !['title','chapter'].includes(scene.type)) errors.push(`scenes[${index}].asset required`);
    if (!scene.asset && ['title','chapter'].includes(scene.type) && typeof scene.text !== 'string') errors.push(`scenes[${index}].text required without an asset`);
    if (scene.fit !== undefined && !FITS.has(scene.fit)) errors.push(`scenes[${index}].fit must be cover or contain`);
    if (scene.track !== undefined && !(Number.isInteger(scene.track) && scene.track >= 0 && scene.track <= 20)) errors.push(`scenes[${index}].track invalid`);
  }
  return { ok: errors.length === 0, errors };
}
