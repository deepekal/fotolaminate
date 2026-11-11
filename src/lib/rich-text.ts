// Helpers for content that may be stored either as plain text (older entries,
// paragraphs separated by line breaks) or as HTML (saved from the rich-text editor).

const TAG_RE = /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i;

export function isHtml(value: string | null | undefined): boolean {
  return Boolean(value && TAG_RE.test(value));
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text → paragraphs (one <p> per non-empty line). */
export function plainToHtml(text: string): string {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join("");
}

/**
 * Prepare stored content for the visual editor. Imported WordPress posts mix list
 * markup with bare text lines and escaped quotes (`start=\"2\"`); turn bare lines into
 * paragraphs so line breaks survive, and keep list/inline markup as-is.
 */
export function toEditorHtml(raw: string | null | undefined): string {
  const value = (raw ?? "").replace(/\\"/g, '"');
  if (!value.trim()) return "";
  if (!isHtml(value)) return plainToHtml(value);
  if (/<(p|h[1-6]|div|blockquote)\b/i.test(value)) return value;

  // Bare text lines with lists/inline tags between them.
  return value
    .split(/(<(?:ul|ol)\b[\s\S]*?<\/(?:ul|ol)>)/i)
    .map((chunk) =>
      /^<(ul|ol)\b/i.test(chunk)
        ? chunk.replace(/\s*\n\s*/g, "")
        : chunk
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l) => `<p>${l}</p>`)
            .join(""),
    )
    .join("");
}

/** Text only — for meta descriptions, schema and previews. */
export function stripHtml(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/<\/(p|h[1-6]|li|div)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
