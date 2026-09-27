import LZString from 'lz-string';

const { decompressFromEncodedURIComponent } = LZString;

// Decodes the ?s= value from a checklist link into its state object, the
// same shape the client keeps in memory (title, theme, items[]). Returns
// null for anything malformed rather than throwing, since this always
// runs on untrusted input straight from a URL.
export function decodeChecklist(encoded) {
  if (!encoded) return null;
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}
