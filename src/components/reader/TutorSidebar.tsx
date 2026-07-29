"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send } from "lucide-react";
import { useReaderStore } from "@/store/readerStore";
import type { Article } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const CHIPS: { label: string; prompt: string }[] = [
  {
    label: "📖 Explain Grammar of selected sentence",
    prompt:
      "Pick the most grammatically interesting sentence from this article (a Band 7+ construction) and explain its grammar step by step, then show one extra example I can imitate.",
  },
  {
    label: "🔄 Provide 3 IELTS Paraphrases",
    prompt:
      "Take one key sentence from the article and give 3 IELTS-style paraphrases of it, pointing out the synonym and structure swaps you used.",
  },
  {
    label: "💡 Break down main idea",
    prompt:
      "Break down the main idea of each paragraph (A, B, C…) in one bullet each, then give a one-sentence summary of the whole article.",
  },
];

/** Safety net: the model is told to avoid Markdown, but strip bold markers if it slips. */
function clean(text: string): string {
  return text.replace(/\*\*/g, "");
}

const GREETING: Message = {
  role: "assistant",
  text: "Hi! I'm your IELTS tutor. I've read this article. Ask me anything, or use a quick action below — I can explain grammar, paraphrase sentences, or break down the main idea.",
};

export function TutorSidebar({ article }: { article: Article }) {
  const { tutorOpen, toggleTutor } = useReaderStore();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, streamText]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (userText: string) => {
    if (busy) return;
    const history = [...messages, { role: "user" as const, text: userText }];
    setMessages(history);
    setBusy(true);
    setStreamText(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let acc = "";
    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          articleId: article.id,
          // Greeting is UI-only; send the real conversation.
          messages: history.slice(1).map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }
      setMessages((m) => [...m, { role: "assistant", text: acc }]);
    } catch (e) {
      if (!controller.signal.aborted) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "Sorry, I couldn't reach the tutor service. Please try again in a moment.",
          },
        ]);
        console.error("AI tutor request failed:", e);
      }
    } finally {
      setStreamText(null);
      setBusy(false);
    }
  };

  const sendChat = () => {
    const el = inputRef.current;
    if (!el || !el.value.trim() || busy) return;
    const text = el.value.trim();
    el.value = "";
    ask(text);
  };

  return (
    <AnimatePresence>
      {tutorOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.2 }}
          className="flex w-[350px] flex-none flex-col border-l border-[var(--border)] bg-[var(--panel)]"
        >
          <div className="flex flex-none items-center gap-[9px] border-b border-[var(--border)] px-4 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] text-white">
              <Sparkles size={14} />
            </div>
            <div>
              <div className="text-[13.5px] font-bold">AI Tutor</div>
              <div className="flex items-center gap-1 text-[11px] text-[var(--green)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                Online · IELTS Academic mode
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={toggleTutor}
              className="flex cursor-pointer rounded-md border-none bg-transparent p-1.5 text-[var(--text3)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
            >
              <X size={15} />
            </button>
          </div>
          <div ref={msgsRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-xl rounded-br-[4px] bg-[var(--acc)] px-[13px] py-[9px] text-[13px] leading-[1.55] text-white"
                      : "max-w-[90%] whitespace-pre-wrap rounded-xl rounded-bl-[4px] border border-[var(--border)] bg-[var(--bg)] px-[13px] py-[9px] text-[13px] leading-[1.55] text-[var(--text)]"
                  }
                >
                  {m.role === "assistant" ? clean(m.text) : m.text}
                </div>
              </div>
            ))}
            {busy && streamText && (
              <div className="flex justify-start">
                <div className="max-w-[90%] whitespace-pre-wrap rounded-xl rounded-bl-[4px] border border-[var(--border)] bg-[var(--bg)] px-[13px] py-[9px] text-[13px] leading-[1.55] text-[var(--text)]">
                  {clean(streamText)}
                </div>
              </div>
            )}
            {busy && !streamText && (
              <div className="flex gap-1 self-start rounded-xl rounded-bl-[4px] border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5">
                <span className="animate-blink h-1.5 w-1.5 rounded-full bg-[var(--text3)]" />
                <span className="animate-blink h-1.5 w-1.5 rounded-full bg-[var(--text3)] [animation-delay:.2s]" />
                <span className="animate-blink h-1.5 w-1.5 rounded-full bg-[var(--text3)] [animation-delay:.4s]" />
              </div>
            )}
          </div>
          <div className="flex-none border-t border-[var(--border)] px-4 py-3">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c.label}
                  disabled={busy}
                  onClick={() => ask(c.prompt)}
                  className="cursor-pointer rounded-full border border-[var(--accbrd)] bg-[var(--accbg)] px-[11px] py-[5px] text-[11.5px] font-semibold text-[var(--hltext)] transition-all hover:brightness-95 disabled:cursor-default disabled:opacity-50"
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendChat();
                }}
                placeholder="Ask about grammar, vocabulary, ideas…"
                className="h-[38px] min-w-0 flex-1 rounded-[9px] border border-[var(--border)] bg-[var(--bg)] px-3 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--acc)]"
              />
              <button
                onClick={sendChat}
                disabled={busy}
                title="Send"
                className="flex h-[38px] w-[38px] flex-none cursor-pointer items-center justify-center rounded-[9px] border-none bg-[var(--acc)] text-white transition-all hover:brightness-110 disabled:cursor-default disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
