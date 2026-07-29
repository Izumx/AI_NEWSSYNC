"use client";

import { useMemo } from "react";
import { useReaderStore } from "@/store/readerStore";
import { parseSegments } from "@/lib/parse";
import { WordSpan } from "./WordSpan";
import type { Article, Segment } from "@/lib/types";

const PARA_LABELS = "ABCDEFGHIJ";

interface Block {
  key: string;
  label: string;
  lang: string;
  segs: Segment[];
  variant: "en" | "ru";
  card: boolean;
  marginBottom: string;
}

function ArticleBlock({ block, font }: { block: Block; font?: string }) {
  const numberBg = block.card ? "bg-[var(--panel)]" : "bg-[var(--bg)]";
  return (
    <div
      className={`${block.marginBottom} ${
        block.card ? "rounded-xl border border-[var(--border)] bg-[var(--bg)] p-[13px]" : ""
      }`}
    >
      <div className="mb-[7px] flex items-center gap-[7px]">
        <span
          className={`flex h-5 w-5 flex-none items-center justify-center rounded-[6px] border border-[var(--border)] text-[10px] font-bold text-[var(--text3)] ${numberBg}`}
        >
          {block.label}
        </span>
        <span className="text-[9.5px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
          {block.lang}
        </span>
      </div>
      <p
        className={`m-0 leading-[1.72] [text-wrap:pretty] ${
          block.variant === "en" ? "text-[var(--text)]" : "text-[15px] text-[var(--text2)]"
        }`}
        style={block.variant === "en" ? { fontFamily: font } : undefined}
      >
        {block.segs.map((s, i) =>
          s.kind === "word" ? (
            <WordSpan key={i} segment={s} variant={block.variant} />
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

export function MobileArticle({ article }: { article: Article }) {
  const mode = useReaderStore((s) => s.mode);
  const serif = useReaderStore((s) => s.serif);
  const font = serif ? "var(--font-serif), Georgia, serif" : "var(--font-inter), system-ui, sans-serif";

  const blocks = useMemo(() => {
    const paras = article.paragraphs_en.map((en, i) => ({
      label: PARA_LABELS[i] ?? String(i + 1),
      en: parseSegments(en),
      ru: parseSegments(article.paragraphs_ru[i] ?? ""),
    }));

    const out: Block[] = [];
    paras.forEach((p) => {
      if (mode !== "ru") {
        out.push({
          key: `${p.label}-en`,
          label: p.label,
          lang: "English",
          segs: p.en,
          variant: "en",
          card: false,
          marginBottom: mode === "bi" ? "mb-3" : "mb-6",
        });
      }
      if (mode !== "en") {
        out.push({
          key: `${p.label}-ru`,
          label: p.label,
          lang: "Русский",
          segs: p.ru,
          variant: "ru",
          card: mode === "bi",
          marginBottom: mode === "bi" ? "mb-[26px]" : "mb-6",
        });
      }
    });
    return out;
  }, [article, mode]);

  const awlCount = article.academic_vocabulary.length;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--panel)] px-[18px] pb-[calc(96px+env(safe-area-inset-bottom))] pt-[18px] md:hidden">
      <h1
        className="mb-1.5 mt-0 text-[22px] font-semibold leading-[1.28] tracking-tight [text-wrap:pretty]"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        {article.title_en}
      </h1>
      <div className="mb-5 text-[11.5px] text-[var(--text3)]">
        {article.reading_time_minutes != null && `${article.reading_time_minutes} min read · `}
        {awlCount > 0 && <span className="font-semibold text-[var(--hltext)]">{awlCount} AWL terms</span>}
        {awlCount > 0 && " · "}
        tap a word to inspect
      </div>
      {blocks.map((b) => (
        <ArticleBlock key={b.key} block={b} font={font} />
      ))}
    </div>
  );
}
