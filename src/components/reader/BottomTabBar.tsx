"use client";

import { useMemo } from "react";
import { Volume2, Pause, ClipboardCheck, Sparkles, Bookmark } from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import { useArticleTts } from "@/hooks/useArticleTts";
import type { Article } from "@/lib/types";

export function BottomTabBar({ article, saved }: { article: Article; saved: Set<string> }) {
  const { setInspectorKey, setQuizOpen, setTutorOpen, vocabOpen, setVocabOpen } = useReaderStore();
  const { playing, toggle } = useArticleTts(article);

  const savedCount = useMemo(
    () => article.academic_vocabulary.filter((v) => saved.has(v.word)).length,
    [article, saved],
  );

  const openQuiz = () => {
    setInspectorKey(null);
    setQuizOpen(true);
  };
  const openTutor = () => {
    setInspectorKey(null);
    setTutorOpen(true);
  };
  const toggleVocab = () => {
    setInspectorKey(null);
    setVocabOpen(!vocabOpen);
  };

  return (
    <div className="flex flex-none items-center gap-1.5 border-t border-[var(--border)] bg-[var(--panel)] px-3.5 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <button
        onClick={toggle}
        className="flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-none py-1 text-[10px] font-semibold transition-colors"
        style={{ color: playing ? "var(--acc)" : "var(--text2)" }}
      >
        {playing ? <Pause size={20} /> : <Volume2 size={20} />}
        {playing ? "Pause" : "Listen"}
      </button>
      <button
        onClick={openQuiz}
        className="relative flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-none py-1 text-[10px] font-semibold text-[var(--text2)]"
      >
        <ClipboardCheck size={20} />
        Quiz
        {article.quiz_questions.length > 0 && (
          <span className="absolute right-[18%] top-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-[1.5px] border-[var(--panel)] bg-amber-500 px-[3px] text-[9.5px] font-bold text-white">
            {article.quiz_questions.length}
          </span>
        )}
      </button>
      <button
        onClick={openTutor}
        className="flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-none py-1 text-[10px] font-semibold text-[var(--text2)]"
      >
        <Sparkles size={20} />
        AI Tutor
      </button>
      <button
        onClick={toggleVocab}
        className="flex flex-1 cursor-pointer flex-col items-center gap-[3px] border-none bg-none py-1 text-[10px] font-semibold text-[var(--text2)]"
      >
        <Bookmark size={20} />
        {savedCount > 0 ? `Saved · ${savedCount}` : "Saved"}
      </button>
    </div>
  );
}
