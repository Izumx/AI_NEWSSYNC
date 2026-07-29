"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  Volume2,
  ClipboardCheck,
  Sparkles,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import { AuthControls } from "./AuthControls";
import { plainText } from "@/lib/parse";
import { speak, stopSpeaking } from "@/lib/tts";
import type { Article } from "@/lib/types";

function toggleButtonClasses(active: boolean) {
  return `flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg border px-3 text-[12.5px] font-semibold transition-all hover:border-[var(--accbrd)] ${
    active
      ? "border-[var(--accbrd)] bg-[var(--accbg)] text-[var(--acc)]"
      : "border-[var(--border)] bg-[var(--panel)] text-[var(--text2)]"
  }`;
}

export function Header({ article }: { article: Article }) {
  const {
    dark,
    sync,
    ttsPlaying,
    tutorOpen,
    toggleDark,
    toggleSync,
    setTtsPlaying,
    toggleTutor,
    setQuizOpen,
  } = useReaderStore();

  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleTts = () => {
    if (ttsPlaying) {
      stopSpeaking();
      setTtsPlaying(false);
    } else {
      const text = article.paragraphs_en.map(plainText).join(" ");
      speak(text, () => setTtsPlaying(false));
      setTtsPlaying(true);
    }
  };

  return (
    <header className="flex min-h-[60px] flex-none flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-[var(--border)] bg-[var(--panel)] px-5 py-2.5 transition-colors">
      <Link
        href="/"
        title="All articles"
        className="flex flex-none items-center gap-2.5 no-underline"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
          <BookOpen size={17} />
        </div>
        <div className="whitespace-nowrap text-[15.5px] font-bold tracking-tight text-[var(--text)]">
          IELTS <span className="text-[var(--acc)]">NewsSync</span>
        </div>
      </Link>
      <div className="h-6 w-px flex-none bg-[var(--border)]" />
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {article.source_name && (
          <span className="whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg)] px-[9px] py-[3px] text-xs font-semibold text-[var(--text2)]">
            {article.source_name}
          </span>
        )}
        {date && <span className="whitespace-nowrap text-xs text-[var(--text3)]">{date}</span>}
        {article.category && (
          <span className="whitespace-nowrap rounded-md bg-[var(--hl)] px-[9px] py-[3px] text-xs font-semibold text-[var(--hltext)]">
            {article.category}
          </span>
        )}
        {article.band_score_target && (
          <span className="whitespace-nowrap rounded-md border border-[var(--greenbrd)] bg-[var(--greenbg)] px-[9px] py-[3px] text-xs font-bold text-[var(--green)]">
            Target Band {article.band_score_target}
          </span>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex flex-wrap items-center gap-2">
        <button title="Toggle synchronized scrolling" onClick={toggleSync} className={toggleButtonClasses(sync)}>
          <ArrowRightLeft size={15} />
          Sync Scroll
          <span
            className={`relative inline-block h-[15px] w-[26px] rounded-full transition-colors ${
              sync ? "bg-[var(--acc)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              className="absolute top-0.5 h-[11px] w-[11px] rounded-full bg-white shadow-sm transition-all"
              style={{ left: sync ? 13 : 2 }}
            />
          </span>
        </button>
        <button title="Listen to article (text-to-speech)" onClick={handleTts} className={toggleButtonClasses(ttsPlaying)}>
          <Volume2 size={15} />
          {ttsPlaying ? "Stop Audio" : "Listen Article"}
        </button>
        <button
          title="Open IELTS practice quiz"
          onClick={() => setQuizOpen(true)}
          className="relative flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg bg-[var(--acc)] px-3 text-[12.5px] font-semibold text-white shadow-[0_2px_8px_rgba(99,102,241,.35)] transition-all hover:brightness-110"
        >
          <ClipboardCheck size={15} />
          IELTS Practice Quiz
          {article.quiz_questions.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[var(--panel)] bg-amber-500 px-1 text-[10.5px] font-bold text-white">
              {article.quiz_questions.length}
            </span>
          )}
        </button>
        <button title="Toggle AI tutor panel" onClick={toggleTutor} className={toggleButtonClasses(tutorOpen)}>
          <Sparkles size={15} />
          AI Tutor
        </button>
        <AuthControls />
        <button
          title="Toggle dark mode"
          onClick={toggleDark}
          className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--text2)] transition-all hover:border-[var(--accbrd)] hover:text-[var(--acc)]"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
