"use client";

import { useReaderStore } from "@/store/readerStore";
import { plainText } from "@/lib/parse";
import { speak, stopSpeaking } from "@/lib/tts";
import type { Article } from "@/lib/types";

/** Shared play/stop control for the desktop header button and mobile tab bar. */
export function useArticleTts(article: Article) {
  const playing = useReaderStore((s) => s.ttsPlaying);
  const setTtsPlaying = useReaderStore((s) => s.setTtsPlaying);

  const toggle = () => {
    if (playing) {
      stopSpeaking();
      setTtsPlaying(false);
    } else {
      const text = article.paragraphs_en.map(plainText).join(" ");
      speak(text, () => setTtsPlaying(false));
      setTtsPlaying(true);
    }
  };

  return { playing, toggle };
}
