"use client";

import Link from "next/link";
import { Sun, Moon, BookOpen } from "lucide-react";
import { useReaderStore, type ReadingMode } from "@/store/readerStore";
import type { Article } from "@/lib/types";

const MODES: { key: ReadingMode; label: string }[] = [
  { key: "en", label: "English" },
  { key: "bi", label: "Bilingual" },
  { key: "ru", label: "Русский" },
];

export function MobileHeader({ article }: { article: Article }) {
  const { dark, serif, mode, toggleDark, setSerif, setMode } = useReaderStore();

  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex-none border-b border-[var(--border)] bg-[var(--panel)] px-4 pt-[max(12px,env(safe-area-inset-top))] transition-colors md:hidden">
      <div className="flex h-[38px] items-center gap-2.5">
        <Link href="/" title="All articles" className="flex flex-1 items-center gap-2.5 no-underline">
          <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
            <BookOpen size={13} />
          </div>
          <div className="min-w-0 truncate text-sm font-bold tracking-tight text-[var(--text)]">
            IELTS <span className="text-[var(--acc)]">NewsSync</span>
          </div>
        </Link>
        <button
          onClick={() => setSerif(!serif)}
          title="Typeface"
          className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--panel)] text-sm font-semibold text-[var(--text2)]"
          style={{ fontFamily: serif ? "var(--font-serif), Georgia, serif" : "inherit" }}
        >
          Aa
        </button>
        <button
          onClick={toggleDark}
          title="Toggle dark mode"
          className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[9px] border border-[var(--border)] bg-[var(--panel)] text-[var(--text2)]"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto py-[9px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {article.source_name && (
          <span className="flex-none whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-[3px] text-[10.5px] font-semibold text-[var(--text2)]">
            {article.source_name}
          </span>
        )}
        {date && (
          <span className="flex-none whitespace-nowrap py-[3px] text-[10.5px] text-[var(--text3)]">{date}</span>
        )}
        {article.category && (
          <span className="flex-none whitespace-nowrap rounded-md bg-[var(--hl)] px-2 py-[3px] text-[10.5px] font-semibold text-[var(--hltext)]">
            {article.category}
          </span>
        )}
        {article.band_score_target && (
          <span className="flex-none whitespace-nowrap rounded-md border border-[var(--greenbrd)] bg-[var(--greenbg)] px-2 py-[3px] text-[10.5px] font-bold text-[var(--green)]">
            Band {article.band_score_target}
          </span>
        )}
      </div>

      <div className="mb-[9px] flex gap-[3px] rounded-[9px] border border-[var(--border)] bg-[var(--bg)] p-[3px]">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`min-h-[32px] flex-1 cursor-pointer rounded-[7px] border-none text-xs font-semibold transition-all ${
              mode === m.key
                ? "bg-[var(--panel)] text-[var(--acc)] [box-shadow:0_1px_3px_rgba(15,23,42,.16)]"
                : "bg-transparent text-[var(--text3)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
