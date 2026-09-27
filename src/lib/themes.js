// Mirrors the THEMES table in public/index.html. Keep these two in sync —
// this copy is what the server-side OG image and meta-tag rewriter use,
// since they can't run the client's JS to read the CSS variables.
export const THEMES = {
  'fresh-start': { label: 'Fresh Start', bg: '#FBF4EC', ink: '#2B241C', accent: '#E8703A', card: '#FFFFFF', line: '#E4D6C3', muted: '#8A7D6B' },
  'boxed-up':    { label: 'Boxed Up',    bg: '#EFE1C6', ink: '#3B2E1A', accent: '#A6521F', card: '#F8EFDA', line: '#D8C296', muted: '#8F7A52' },
  'new-nest':    { label: 'New Nest',    bg: '#F1F3E9', ink: '#26311F', accent: '#5C7A5A', card: '#FBFCF7', line: '#D6DEC4', muted: '#7C8B6E' },
  'road-trip':   { label: 'Road Trip',   bg: '#EAF2F1', ink: '#1E3436', accent: '#D3572E', card: '#FFFFFF', line: '#C7DEDA', muted: '#5E7C7A' },
  'clean-slate': { label: 'Clean Slate', bg: '#F4F4F2', ink: '#1B1C20', accent: '#1B1C20', card: '#FFFFFF', line: '#DEDEDA', muted: '#8A8A85' },
  'win95':       { label: 'Y2K Desktop', bg: '#008080', ink: '#000000', accent: '#000080', card: '#C0C0C0', line: '#6b6b6b', muted: '#333333' },
};

export function getTheme(id) {
  return THEMES[id] || THEMES['fresh-start'];
}
