"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import type { Article } from "@/lib/types";

export function SavedWordsSheet({ article, saved }: { article: Article; saved: Set<string> }) {
  const { vocabOpen, setVocabOpen, setInspectorKey } = useReaderStore();

  const words = useMemo(
    () => article.academic_vocabulary.filter((v) => saved.has(v.word)),
    [article, saved],
  );

  return (
    <AnimatePresence>
      {vocabOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.2, 0.9, 0.3, 1] }}
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--panel)] pt-[env(safe-area-inset-top)] md:hidden"
        >
          <div className="flex flex-none items-center gap-2.5 border-b border-[var(--border)] px-[18px] pb-[14px] pt-4">
            <div>
              <div className="text-[14.5px] font-bold">My Vocabulary</div>
              <div className="text-[11px] text-[var(--text3)]">
                {words.length === 1 ? "1 word saved here" : `${words.length} words saved here`}
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setVocabOpen(false)}
              className="flex cursor-pointer rounded-md border-none bg-transparent p-[5px] text-[var(--text3)]"
            >
              <X size={17} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-[9px] overflow-y-auto px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4">
            {words.length === 0 ? (
              <div className="m-auto px-5 py-10 text-center text-[13px] leading-relaxed text-[var(--text3)]">
                No saved words yet.
                <br />
                Tap a highlighted word in the article, then hit{" "}
                <span className="font-semibold text-[var(--acc)]">Save to Anki / Vocabulary</span>.
              </div>
            ) : (
              words.map((v) => (
                <button
                  key={v.word}
                  onClick={() => {
                    setVocabOpen(false);
                    setInspectorKey(v.word);
                  }}
                  className="flex cursor-pointer items-center gap-[11px] rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[7px]">
                      <span className="text-sm font-bold text-[var(--text)]">{v.word}</span>
                      <span className="rounded-[4px] bg-[var(--hl)] px-1.5 py-[2px] text-[9.5px] font-bold text-[var(--hltext)]">
                        {v.cefr}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--text2)]">{v.trans_ru}</div>
                  </div>
                  <ChevronRight size={15} className="flex-none text-[var(--text3)]" />
                </button>
              ))
            )}
          </div>
          <div className="flex-none border-t border-[var(--border)] px-[18px] py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <Link
              href="/flashcards"
              className="flex h-11 items-center justify-center rounded-xl bg-[var(--acc)] text-[13.5px] font-semibold text-white no-underline"
            >
              Review all in Flashcards
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
