"use client";

import { useEffect, useMemo } from "react";
import { useReaderStore } from "@/store/readerStore";
import { useSavedWords } from "@/hooks/useSavedWords";
import { stopSpeaking } from "@/lib/tts";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { SplitView } from "./SplitView";
import { MobileArticle } from "./MobileArticle";
import { BottomTabBar } from "./BottomTabBar";
import { WordInspector } from "./WordInspector";
import { TutorSidebar } from "./TutorSidebar";
import { QuizModal } from "./QuizModal";
import { SavedWordsSheet } from "./SavedWordsSheet";
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
      <MobileHeader article={article} />
      <Header article={article} />
      <div className="flex min-h-0 flex-1">
        <SplitView article={article} />
        <MobileArticle article={article} />
        <TutorSidebar article={article} />
      </div>
      <BottomTabBar article={article} saved={saved} />
      <WordInspector vocab={vocab} saved={saved} onToggleSave={toggle} />
      <QuizModal article={article} />
      <SavedWordsSheet article={article} saved={saved} />
    </div>
  );
}
