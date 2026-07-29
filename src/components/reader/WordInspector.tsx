"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2, X, Check, Bookmark } from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import { speak } from "@/lib/tts";
import type { VocabEntry } from "@/lib/types";

export function WordInspector({
  vocab,
  saved,
  onToggleSave,
}: {
  vocab: Record<string, VocabEntry>;
  saved: Set<string>;
  onToggleSave: (entry: VocabEntry) => void;
}) {
  const { inspectorKey, setInspectorKey } = useReaderStore();
  const entry = inspectorKey ? vocab[inspectorKey] : null;
  const isSaved = entry ? saved.has(entry.word) : false;

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          key={entry.word}
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 28, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0.9, 0.3, 1] }}
          className="fixed bottom-5 left-1/2 z-[60] w-[min(860px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] [box-shadow:var(--shadow)]"
        >
          <div className="flex items-start gap-5 px-6 pb-[18px] pt-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[22px] font-bold tracking-tight">{entry.word}</span>
                <span
                  className="text-[13.5px] text-[var(--text2)]"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  {entry.ipa}
                </span>
                <button
                  onClick={() => speak(entry.word)}
                  title="Pronounce"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border border-[var(--border)] bg-[var(--bg)] text-[var(--acc)] transition-all hover:border-[var(--accbrd)] hover:bg-[var(--accbg)]"
                >
                  <Volume2 size={14} />
                </button>
                <span className="rounded-[5px] bg-[var(--hl)] px-2 py-[3px] text-[11px] font-bold text-[var(--hltext)]">
                  CEFR {entry.cefr}
                </span>
                <span className="rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-2 py-[3px] text-[11px] font-semibold text-[var(--text3)]">
                  {entry.pos}
                </span>
                <span className="text-[11px] font-semibold text-[var(--text3)]">Academic Word List</span>
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-5">
                <div>
                  <div className="mb-[5px] text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                    Definition · Cambridge
                  </div>
                  <div className="text-[13.5px] leading-[1.55] text-[var(--text)]">{entry.def_en}</div>
                  <div className="mb-[5px] mt-3 text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                    Contextual Russian
                  </div>
                  <div className="text-sm font-semibold text-[var(--acc)]">{entry.trans_ru}</div>
                </div>
                <div>
                  <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                    Collocations
                  </div>
                  <div className="mb-3 flex flex-wrap gap-[5px]">
                    {entry.collocations.map((col) => (
                      <span
                        key={col}
                        className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-[3px] text-[11.5px] font-semibold text-[var(--text2)]"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                  <div className="mb-[5px] text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                    IELTS example
                  </div>
                  <div className="border-l-2 border-[var(--accbrd)] pl-2.5 text-[13px] italic leading-[1.55] text-[var(--text2)]">
                    “{entry.context_sentence}”
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-none flex-col items-end gap-2">
              <button
                onClick={() => setInspectorKey(null)}
                className="flex cursor-pointer rounded-md border-none bg-transparent p-1 text-[var(--text3)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
              >
                <X size={16} />
              </button>
              <button
                onClick={() => onToggleSave(entry)}
                className={`flex h-9 cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-[9px] border px-3.5 text-[12.5px] font-semibold transition-all hover:brightness-95 ${
                  isSaved
                    ? "border-[var(--greenbrd)] bg-[var(--greenbg)] text-[var(--green)]"
                    : "border-[var(--acc)] bg-[var(--acc)] text-white"
                }`}
              >
                {isSaved ? <Check size={14} strokeWidth={2.5} /> : <Bookmark size={14} />}
                {isSaved ? "Saved to Vocabulary" : "Save to Anki / Vocabulary"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
