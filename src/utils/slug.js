// Single shared slug utility. Habitation ids in data/habitations.js are
// already authored as slugs of their names (e.g. "Kovalam East" ->
// "kovalam-east") — this function exists so any future data or generated
// route never has to hand-author a slug or risk drifting from this format.
export function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const habitationPath = (habitation) => `/app/habitations/${habitation.id}`
