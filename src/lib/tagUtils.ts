/** Derive a slug-style @tag from a file/reference name — shared utility (no 'use server') */
export function nameToTag(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')         // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')      // strip all non-alphanumeric ("gloria's room" → "gloriasroom")
    .slice(0, 32);
}
