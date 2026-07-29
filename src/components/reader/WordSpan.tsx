"use client";

import { useReaderStore } from "@/store/readerStore";
import type { Segment } from "@/lib/types";

export function WordSpan({
  segment,
  variant,
}: {
  segment: Extract<Segment, { kind: "word" }>;
  variant: "en" | "ru";
}) {
  const { inspectorKey, setInspectorKey, setVocabOpen } = useReaderStore();
  const active = inspectorKey === segment.key;

  const base = "cursor-pointer rounded px-[3px] transition-all";
  let cls: string;
  if (active) {
    cls = `${base} bg-[var(--acc)] text-white ${variant === "ru" ? "font-semibold" : ""}`;
  } else if (variant === "en") {
    cls = `${base} bg-[var(--hl)] font-medium text-[var(--hltext)] hover:brightness-95`;
  } else {
    cls = `${base} border-b-[1.5px] border-dotted border-[var(--accbrd)] text-[var(--text)]`;
  }

  return (
    <span
      title="Click to inspect this word"
      className={cls}
      onClick={() => {
        setInspectorKey(active ? null : segment.key);
        // No-op on desktop; closes the mobile "saved words" sheet behind it.
        setVocabOpen(false);
      }}
    >
      {segment.text}
    </span>
  );
}
