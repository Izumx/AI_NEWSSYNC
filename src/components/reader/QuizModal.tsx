"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCheck, X, Check } from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import { createClient } from "@/lib/supabase/client";
import type { Article } from "@/lib/types";

export function QuizModal({ article }: { article: Article }) {
  const { quizOpen, setQuizOpen } = useReaderStore();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const openedAtRef = useRef<number>(Date.now());

  const questions = article.quiz_questions;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;
  const score = questions.filter((q, i) => answers[i] === q.correct_answer).length;

  const checkAnswers = async () => {
    if (!allAnswered || checked) return;
    setChecked(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_quiz_attempts").insert({
        user_id: user.id,
        article_id: article.id,
        score,
        total_questions: questions.length,
        time_spent_seconds: Math.round((Date.now() - openedAtRef.current) / 1000),
      });
    }
  };

  const reset = () => {
    setAnswers({});
    setChecked(false);
    openedAtRef.current = Date.now();
  };

  return (
    <AnimatePresence>
      {quizOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setQuizOpen(false)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(15,23,42,.55)] p-0 md:p-6 md:backdrop-blur-[3px]"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.9, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full max-h-full w-full flex-col overflow-hidden border-[var(--border)] bg-[var(--panel)] md:h-auto md:max-h-[calc(100vh-60px)] md:w-[min(680px,100%)] md:rounded-2xl md:border md:[box-shadow:var(--shadow)]"
          >
            <div className="flex flex-none items-center gap-2.5 border-b border-[var(--border)] px-6 pb-[18px] pt-[max(18px,env(safe-area-inset-top))] md:pt-[18px]">
              <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[var(--accbg)] text-[var(--acc)]">
                <ClipboardCheck size={16} />
              </div>
              <div>
                <div className="text-[15px] font-bold">IELTS Reading Practice</div>
                <div className="text-xs text-[var(--text3)]">
                  {questions.length} questions · generated from this article
                </div>
              </div>
              <div className="flex-1" />
              {checked && (
                <span
                  className={`rounded-lg px-3 py-[5px] text-[13px] font-bold ${
                    score === questions.length
                      ? "bg-[var(--greenbg)] text-[var(--green)]"
                      : "bg-[var(--accbg)] text-[var(--acc)]"
                  }`}
                >
                  Score: {score}/{questions.length}
                </span>
              )}
              <button
                onClick={() => setQuizOpen(false)}
                className="flex cursor-pointer rounded-md border-none bg-transparent p-1.5 text-[var(--text3)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-[22px]">
              {questions.map((q, qi) => {
                const picked = answers[qi];
                const correct = picked === q.correct_answer;
                return (
                  <div key={q.id}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="whitespace-nowrap rounded-[5px] bg-[var(--hl)] px-2 py-[3px] text-[10.5px] font-bold uppercase tracking-[.07em] text-[var(--hltext)]">
                        {q.type}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text3)]">Question {qi + 1}</span>
                    </div>
                    <div className="mb-2.5 text-[14.5px] font-semibold leading-normal [text-wrap:pretty]">
                      {q.question}
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      {q.options.map((opt, oi) => {
                        const isPicked = picked === oi;
                        let colors = "border-[var(--border)] bg-[var(--panel)] text-[var(--text)]";
                        if (checked) {
                          if (oi === q.correct_answer)
                            colors = "border-[var(--greenbrd)] bg-[var(--greenbg)] text-[var(--green)]";
                          else if (isPicked)
                            colors = "border-[var(--redbrd)] bg-[var(--redbg)] text-[var(--red)]";
                        } else if (isPicked) {
                          colors = "border-[var(--acc)] bg-[var(--accbg)] text-[var(--acc)]";
                        }
                        return (
                          <button
                            key={oi}
                            onClick={() => {
                              if (!checked) setAnswers((a) => ({ ...a, [qi]: oi }));
                            }}
                            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-[1.5px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all hover:border-[var(--accbrd)] ${colors}`}
                          >
                            <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border border-current text-[11px] font-bold">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1 text-left">{opt}</span>
                            {checked && oi === q.correct_answer && (
                              <Check size={15} strokeWidth={2.5} className="text-[var(--green)]" />
                            )}
                            {checked && isPicked && oi !== q.correct_answer && (
                              <X size={15} strokeWidth={2.5} className="text-[var(--red)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {checked && (
                      <div
                        className={`mt-2.5 rounded-[9px] border px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                          correct
                            ? "border-[var(--greenbrd)] bg-[var(--greenbg)] text-[var(--green)]"
                            : "border-[var(--redbrd)] bg-[var(--redbg)] text-[var(--red)]"
                        }`}
                      >
                        <span className="font-bold">
                          {correct ? "Correct." : picked === undefined ? "Not answered." : "Incorrect."}
                        </span>{" "}
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-none items-center gap-2.5 border-t border-[var(--border)] bg-[var(--bg)] px-6 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5 md:pb-3.5">
              <span className="text-xs text-[var(--text3)]">
                {checked
                  ? "Review the explanations above, then try again."
                  : `${answered} of ${questions.length} answered`}
              </span>
              <div className="flex-1" />
              {checked && (
                <button
                  onClick={reset}
                  className="h-9 cursor-pointer rounded-[9px] border border-[var(--border)] bg-[var(--panel)] px-4 text-[13px] font-semibold text-[var(--text)] transition-all hover:border-[var(--accbrd)]"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={checkAnswers}
                className={`h-9 rounded-[9px] border-none px-[18px] text-[13px] font-semibold text-white transition-all ${
                  allAnswered && !checked
                    ? "cursor-pointer bg-[var(--acc)] hover:brightness-110"
                    : "cursor-default bg-[var(--border)]"
                } ${checked ? "opacity-50" : ""}`}
              >
                Check Answers
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
