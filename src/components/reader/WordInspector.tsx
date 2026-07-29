"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Volume2, X, Check, Bookmark } from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import { speak } from "@/lib/tts";
import type { VocabEntry } from "@/lib/types";

function SaveButton({
  isSaved,
  onClick,
  full,
}: {
  isSaved: boolean;
  onClick: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 cursor-pointer items-center justify-center gap-[7px] whitespace-nowrap rounded-xl border text-[13.5px] font-semibold transition-all hover:brightness-95 ${
        full ? "w-full" : "px-3.5"
      } ${
        isSaved
          ? "border-[var(--greenbrd)] bg-[var(--greenbg)] text-[var(--green)]"
          : "border-[var(--acc)] bg-[var(--acc)] text-white"
      }`}
    >
      {isSaved ? <Check size={15} strokeWidth={2.5} /> : <Bookmark size={15} />}
      {isSaved ? "Saved to Vocabulary" : "Save to Anki / Vocabulary"}
    </button>
  );
}

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
  const close = () => setInspectorKey(null);

  return (
    <AnimatePresence>
      {entry && (
        <>
          {/* Mobile: bottom sheet */}
          <motion.div
            key="inspector-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-[55] bg-[rgba(15,23,42,.4)] md:hidden"
          />
          <motion.div
            key="inspector-mobile"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[80vh] overflow-y-auto rounded-t-[20px] border-t border-[var(--border)] bg-[var(--panel)] [box-shadow:var(--shadow)] md:hidden"
          >
            <div className="flex justify-center pb-[3px] pt-2.5">
              <span className="h-1 w-[38px] rounded-full bg-[var(--border)]" />
            </div>
            <div className="px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-1.5">
              <div className="mb-1 flex flex-wrap items-center gap-2.5">
                <span className="text-[21px] font-bold tracking-tight">{entry.word}</span>
                <button
                  onClick={() => speak(entry.word)}
                  title="Pronounce"
                  className="flex h-[27px] w-[27px] flex-none cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--acc)]"
                >
                  <Volume2 size={13} />
                </button>
                <span className="rounded-[5px] bg-[var(--hl)] px-[7px] py-[3px] text-[10.5px] font-bold text-[var(--hltext)]">
                  CEFR {entry.cefr}
                </span>
                <span className="rounded-[5px] border border-[var(--border)] bg-[var(--bg)] px-[7px] py-[3px] text-[10.5px] font-semibold text-[var(--text3)]">
                  {entry.pos}
                </span>
                <div className="flex-1" />
                <button
                  onClick={close}
                  className="flex cursor-pointer rounded-md border-none bg-transparent p-1 text-[var(--text3)]"
                >
                  <X size={16} />
                </button>
              </div>
              <div
                className="mb-3.5 text-[12.5px] text-[var(--text2)]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                {entry.ipa}
              </div>
              <div className="mb-1 text-[9.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                Definition · Cambridge
              </div>
              <div className="mb-3 text-[13px] leading-[1.55]">{entry.def_en}</div>
              <div className="mb-1 text-[9.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                Contextual Russian
              </div>
              <div className="mb-3.5 text-sm font-semibold text-[var(--acc)]">{entry.trans_ru}</div>
              <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                Collocations
              </div>
              <div className="mb-3.5 flex flex-wrap gap-[5px]">
                {entry.collocations.map((col) => (
                  <span
                    key={col}
                    className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--bg)] px-[9px] py-[3px] text-[11px] font-semibold text-[var(--text2)]"
                  >
                    {col}
                  </span>
                ))}
              </div>
              <div className="mb-[5px] text-[9.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
                IELTS example
              </div>
              <div className="mb-[18px] border-l-2 border-[var(--accbrd)] pl-2.5 text-[12.5px] italic leading-[1.55] text-[var(--text2)]">
                “{entry.context_sentence}”
              </div>
              <SaveButton isSaved={isSaved} onClick={() => onToggleSave(entry)} full />
            </div>
          </motion.div>

          {/* Desktop: floating pill */}
          <motion.div
            key="inspector-desktop"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.9, 0.3, 1] }}
            className="fixed bottom-5 left-1/2 z-[60] hidden w-[min(860px,calc(100vw-40px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] [box-shadow:var(--shadow)] md:block"
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
                  onClick={close}
                  className="flex cursor-pointer rounded-md border-none bg-transparent p-1 text-[var(--text3)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                >
                  <X size={16} />
                </button>
                <SaveButton isSaved={isSaved} onClick={() => onToggleSave(entry)} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
