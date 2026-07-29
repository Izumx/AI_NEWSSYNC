"use client";

import { useMemo, useRef } from "react";
import { useReaderStore } from "@/store/readerStore";
import { useSyncScroll } from "@/hooks/useSyncScroll";
import { parseSegments } from "@/lib/parse";
import type { Article, Segment } from "@/lib/types";

const PARA_LABELS = "ABCDEFGHIJ";

function WordSpan({
  segment,
  variant,
}: {
  segment: Extract<Segment, { kind: "word" }>;
  variant: "en" | "ru";
}) {
  const { inspectorKey, setInspectorKey } = useReaderStore();
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
      onClick={() => setInspectorKey(active ? null : segment.key)}
    >
      {segment.text}
    </span>
  );
}

function Paragraph({
  label,
  segments,
  variant,
  numberBg,
  className,
  style,
}: {
  label: string;
  segments: Segment[];
  variant: "en" | "ru";
  numberBg: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="mb-[26px] flex gap-4">
      <span
        className={`mt-1 flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] border border-[var(--border)] text-[11.5px] font-bold text-[var(--text3)] ${numberBg}`}
      >
        {label}
      </span>
      <p className={`m-0 leading-[1.75] [text-wrap:pretty] ${className ?? ""}`} style={style}>
        {segments.map((s, i) =>
          s.kind === "word" ? (
            <WordSpan key={i} segment={s} variant={variant} />
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </div>
  );
}

export function SplitView({ article }: { article: Article }) {
  const { sync, serif, setSerif } = useReaderStore();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const { onLeftScroll, onRightScroll } = useSyncScroll(leftRef, rightRef, sync);

  const paras = useMemo(
    () =>
      article.paragraphs_en.map((en, i) => ({
        label: PARA_LABELS[i] ?? String(i + 1),
        en: parseSegments(en),
        ru: parseSegments(article.paragraphs_ru[i] ?? ""),
      })),
    [article],
  );

  const awlCount = article.academic_vocabulary.length;

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      {/* LEFT: English article */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-[var(--border)]">
        <div className="flex h-[46px] flex-none items-center gap-2.5 border-b border-[var(--border)] bg-[var(--panel)] px-7 py-2.5 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
            Original · English
          </span>
          <div className="flex-1" />
          <div className="flex gap-1 rounded-[7px] border border-[var(--border)] bg-[var(--bg)] p-[3px]">
            <button
              onClick={() => setSerif(false)}
              className={`cursor-pointer rounded-[5px] border-none px-2.5 py-[3px] font-sans text-[11.5px] font-semibold transition-all ${
                serif ? "bg-transparent text-[var(--text3)]" : "bg-[var(--panel)] text-[var(--text)] shadow-sm"
              }`}
            >
              Inter
            </button>
            <button
              onClick={() => setSerif(true)}
              className={`cursor-pointer rounded-[5px] border-none px-2.5 py-[3px] text-[11.5px] font-semibold transition-all ${
                serif ? "bg-[var(--panel)] text-[var(--text)] shadow-sm" : "bg-transparent text-[var(--text3)]"
              }`}
              style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              Serif
            </button>
          </div>
        </div>
        <div ref={leftRef} onScroll={onLeftScroll} className="flex-1 overflow-y-auto px-11 pb-[140px] pt-9">
          <h1
            className="mb-2 mt-0 text-[29px] font-semibold leading-[1.25] tracking-tight [text-wrap:pretty]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            {article.title_en}
          </h1>
          <div className="mb-[30px] flex items-center gap-2 text-[13px] text-[var(--text3)]">
            {article.source_name && <span>{article.source_name}</span>}
            {article.reading_time_minutes != null && (
              <>
                <span>·</span>
                <span>{article.reading_time_minutes} min read</span>
              </>
            )}
            {awlCount > 0 && (
              <>
                <span>·</span>
                <span className="font-semibold text-[var(--hltext)]">{awlCount} AWL terms highlighted</span>
              </>
            )}
          </div>
          {paras.map((p) => (
            <Paragraph
              key={p.label}
              label={p.label}
              segments={p.en}
              variant="en"
              numberBg="bg-[var(--bg)]"
              className="text-[var(--text)]"
              style={{
                fontFamily: serif ? "var(--font-serif), Georgia, serif" : "var(--font-inter), system-ui, sans-serif",
                fontSize: serif ? "17.5px" : "16px",
              }}
            />
          ))}
        </div>
      </div>
      {/* RIGHT: Russian translation */}
      <div className="flex min-w-0 flex-1 flex-col bg-[var(--bg)]">
        <div className="flex h-[46px] flex-none items-center gap-2.5 border-b border-[var(--border)] bg-[var(--panel)] px-7 py-2.5 transition-colors">
          <span className="text-[11px] font-bold uppercase tracking-[.08em] text-[var(--text3)]">
            Перевод · Русский
          </span>
          <div className="flex-1" />
          <span
            className={`flex items-center gap-[5px] text-[11px] font-semibold ${
              sync ? "text-[var(--green)]" : "text-[var(--text3)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${sync ? "bg-[var(--green)]" : "bg-[var(--text3)]"}`}
            />
            {sync ? "Synchronized scrolling" : "Independent scrolling"}
          </span>
        </div>
        <div ref={rightRef} onScroll={onRightScroll} className="flex-1 overflow-y-auto px-11 pb-[140px] pt-9">
          <h1
            className="mb-2 mt-0 text-[29px] font-semibold leading-[1.25] tracking-tight text-[var(--text2)] [text-wrap:pretty]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            {article.title_ru}
          </h1>
          <div className="mb-[30px] text-[13px] text-[var(--text3)]">
            Точный литературный перевод · выровнен по абзацам
          </div>
          {paras.map((p) => (
            <Paragraph
              key={p.label}
              label={p.label}
              segments={p.ru}
              variant="ru"
              numberBg="bg-[var(--panel)]"
              className="text-base text-[var(--text2)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
