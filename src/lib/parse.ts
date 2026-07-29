import type { Segment } from "./types";

/**
 * Splits paragraph markup into plain/word segments.
 * `*word*` → highlighted AWL word; `*word:display*` → highlighted with a
 * different display text (used for inflected Russian translations).
 */
export function parseSegments(markup: string): Segment[] {
  const out: Segment[] = [];
  markup.split(/\*([^*]+)\*/).forEach((part, i) => {
    if (i % 2 === 0) {
      if (part) out.push({ kind: "plain", text: part });
    } else {
      const colon = part.indexOf(":");
      out.push(
        colon > -1
          ? { kind: "word", key: part.slice(0, colon).toLowerCase(), text: part.slice(colon + 1) }
          : { kind: "word", key: part.toLowerCase(), text: part },
      );
    }
  });
  return out;
}

export function plainText(markup: string): string {
  return parseSegments(markup)
    .map((s) => s.text)
    .join("");
}
