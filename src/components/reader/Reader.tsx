"use client";

import { useEffect, useMemo } from "react";
import { useReaderStore } from "@/store/readerStore";
import { useSavedWords } from "@/hooks/useSavedWords";
import { stopSpeaking } from "@/lib/tts";
import { Header } from "./Header";
import { SplitView } from "./SplitView";
import { WordInspector } from "./WordInspector";
import { TutorSidebar } from "./TutorSidebar";
import { QuizModal } from "./QuizModal";
import type { Article, VocabEntry } from "@/lib/types";

export function Reader({ article }: { article: Article }) {
  const dark = useReaderStore((s) => s.dark);
  const { saved, toggle } = useSavedWords();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => stopSpeaking, []);

  const vocab = useMemo(() => {
    const map: Record<string, VocabEntry> = {};
    for (const entry of article.academic_vocabulary) {
      map[entry.word.toLowerCase()] = entry;
    }
    return map;
  }, [article]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header article={article} />
      <div className="flex min-h-0 flex-1">
        <SplitView article={article} />
        <TutorSidebar article={article} />
      </div>
      <WordInspector vocab={vocab} saved={saved} onToggleSave={toggle} />
      <QuizModal article={article} />
    </div>
  );
}
