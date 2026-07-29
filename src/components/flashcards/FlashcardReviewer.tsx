"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Volume2,
  Download,
  RotateCcw,
  PartyPopper,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { speak } from "@/lib/tts";
import { applyGrade, GRADES, type Grade } from "@/lib/srs";
import type { SavedWord } from "@/lib/types";

const GRADE_STYLES: Record<Grade, string> = {
  again: "border-[var(--redbrd)] bg-[var(--redbg)] text-[var(--red)]",
  hard: "border-[var(--border)] bg-[var(--panel)] text-[var(--text2)]",
  good: "border-[var(--accbrd)] bg-[var(--accbg)] text-[var(--acc)]",
  easy: "border-[var(--greenbrd)] bg-[var(--greenbg)] text-[var(--green)]",
};

function exportAnkiCsv(words: SavedWord[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = words.map((w) => {
    const front = `${w.word}${w.ipa ? ` ${w.ipa}` : ""}`;
    const back = [w.definition, w.translation, w.context_sentence ? `<i>${w.context_sentence}</i>` : null]
      .filter(Boolean)
      .join("<br><br>");
    return `${esc(front)},${esc(back)}`;
  });
  // BOM so Cyrillic text opens correctly everywhere; Anki: File → Import, HTML on.
  const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ielts-newssync-anki.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function FlashcardReviewer({ initialWords }: { initialWords: SavedWord[] }) {
  const [words, setWords] = useState<SavedWord[]>(initialWords);
  const now = useMemo(() => new Date().toISOString(), []);
  const [queue, setQueue] = useState<string[]>(() =>
    initialWords.filter((w) => w.next_review_at <= now).map((w) => w.id),
  );
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const current = queue.length > 0 ? words.find((w) => w.id === queue[0]) : undefined;

  const grade = async (g: Grade) => {
    if (!current) return;
    const { stage, nextReviewAt } = applyGrade(current.srs_stage, g);

    setWords((ws) =>
      ws.map((w) =>
        w.id === current.id
          ? { ...w, srs_stage: stage, next_review_at: nextReviewAt.toISOString() }
          : w,
      ),
    );
    // "Again" puts the card back at the end of today's queue; otherwise it's done.
    setQueue((q) => (g === "again" ? [...q.slice(1), current.id] : q.slice(1)));
    if (g !== "again") setReviewed((r) => r + 1);
    setFlipped(false);

    const supabase = createClient();
    await supabase
      .from("user_saved_words")
      .update({ srs_stage: stage, next_review_at: nextReviewAt.toISOString() })
      .eq("id", current.id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="flex min-h-[60px] flex-none flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-[var(--border)] bg-[var(--panel)] px-5 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text2)] no-underline hover:text-[var(--acc)]"
        >
          <ArrowLeft size={15} />
          Reader
        </Link>
        <div className="h-6 w-px flex-none bg-[var(--border)]" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
            <GraduationCap size={17} />
          </div>
          <div className="text-[15.5px] font-bold tracking-tight">Flashcards</div>
        </div>
        <span className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-[9px] py-[3px] text-xs font-semibold text-[var(--text2)]">
          {words.length} saved · {queue.length} due
        </span>
        <div className="flex-1" />
        <button
          onClick={() => exportAnkiCsv(words)}
          disabled={words.length === 0}
          className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-[12.5px] font-semibold text-[var(--text2)] transition-all hover:border-[var(--accbrd)] disabled:cursor-default disabled:opacity-50"
        >
          <Download size={15} />
          Export to Anki (.csv)
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        {words.length === 0 ? (
          <div className="max-w-[380px] text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accbg)] text-[var(--acc)]">
              <BookOpen size={22} />
            </div>
            <h1 className="mb-1.5 text-[17px] font-bold">No saved words yet</h1>
            <p className="mb-5 text-[13.5px] leading-relaxed text-[var(--text2)]">
              Click a highlighted word while reading and press “Save to Anki / Vocabulary” — it will
              appear here for spaced-repetition review.
            </p>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-[9px] bg-[var(--acc)] px-5 text-[13.5px] font-semibold text-white no-underline transition-all hover:brightness-110"
            >
              Start reading
            </Link>
          </div>
        ) : !current ? (
          <div className="max-w-[380px] text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--greenbg)] text-[var(--green)]">
              <PartyPopper size={22} />
            </div>
            <h1 className="mb-1.5 text-[17px] font-bold">All caught up!</h1>
            <p className="mb-5 text-[13.5px] leading-relaxed text-[var(--text2)]">
              {reviewed > 0
                ? `You reviewed ${reviewed} ${reviewed === 1 ? "card" : "cards"} today. `
                : ""}
              Come back when the next review is due, or keep reading to save new words.
            </p>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-[9px] bg-[var(--acc)] px-5 text-[13.5px] font-semibold text-white no-underline transition-all hover:brightness-110"
            >
              Back to reading
            </Link>
          </div>
        ) : (
          <div className="w-full max-w-[520px]">
            <div className="mb-4 flex items-center justify-between text-[12px] font-semibold text-[var(--text3)]">
              <span>
                Card {reviewed + 1} · {queue.length} left
              </span>
              <span>Stage {current.srs_stage}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id + (flipped ? "-back" : "-front")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={() => setFlipped(true)}
                className={`mb-5 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center [box-shadow:var(--shadow)] ${
                  flipped ? "" : "cursor-pointer"
                }`}
              >
                {!flipped ? (
                  <>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-[32px] font-bold tracking-tight">{current.word}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(current.word);
                        }}
                        title="Pronounce"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--acc)] transition-all hover:border-[var(--accbrd)] hover:bg-[var(--accbg)]"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                    {current.ipa && (
                      <div
                        className="mb-6 text-[14px] text-[var(--text2)]"
                        style={{ fontFamily: "var(--font-mono), monospace" }}
                      >
                        {current.ipa}
                      </div>
                    )}
                    <div className="text-[12.5px] font-semibold text-[var(--text3)]">
                      Click to reveal the answer
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-1 text-[20px] font-bold">{current.word}</div>
                    {current.translation && (
                      <div className="mb-4 text-[16px] font-semibold text-[var(--acc)]">
                        {current.translation}
                      </div>
                    )}
                    {current.definition && (
                      <div className="mb-4 max-w-[420px] text-[14px] leading-relaxed text-[var(--text)]">
                        {current.definition}
                      </div>
                    )}
                    {current.context_sentence && (
                      <div className="max-w-[420px] border-l-2 border-[var(--accbrd)] pl-3 text-left text-[13px] italic leading-relaxed text-[var(--text2)]">
                        “{current.context_sentence}”
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {flipped ? (
              <div className="grid grid-cols-4 gap-2.5">
                {GRADES.map(({ grade: g, label, hint }) => (
                  <button
                    key={g}
                    onClick={() => grade(g)}
                    className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border-[1.5px] py-2.5 transition-all hover:brightness-95 ${GRADE_STYLES[g]}`}
                  >
                    <span className="text-[13.5px] font-bold">{label}</span>
                    <span className="text-[11px] font-semibold opacity-75">
                      {hint(current.srs_stage)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setFlipped(true)}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-[var(--acc)] text-[14px] font-semibold text-white transition-all hover:brightness-110"
              >
                <RotateCcw size={15} />
                Show Answer
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
