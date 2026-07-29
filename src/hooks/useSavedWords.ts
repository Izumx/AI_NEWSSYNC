"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VocabEntry } from "@/lib/types";

const LOCAL_KEY = "newssync_saved_words";

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Saved-word state backed by Supabase when the user is signed in and by
 * localStorage otherwise, so "Save to Vocabulary" always works.
 */
export function useSavedWords() {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const userIdRef = useRef<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (user) {
        userIdRef.current = user.id;
        const { data } = await supabase.from("user_saved_words").select("word");
        if (!cancelled && data) setSaved(new Set(data.map((r) => r.word)));
      } else {
        setSaved(new Set(readLocal()));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback(async (entry: VocabEntry) => {
    const word = entry.word;
    let nowSaved = false;
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
        nowSaved = true;
      }
      return next;
    });

    const supabase = supabaseRef.current;
    const userId = userIdRef.current;
    if (supabase && userId) {
      if (nowSaved) {
        await supabase.from("user_saved_words").upsert(
          {
            user_id: userId,
            word,
            ipa: entry.ipa,
            translation: entry.trans_ru,
            definition: entry.def_en,
            context_sentence: entry.context_sentence,
          },
          { onConflict: "user_id,word" },
        );
      } else {
        await supabase.from("user_saved_words").delete().eq("word", word);
      }
    } else {
      const local = new Set(readLocal());
      if (nowSaved) local.add(word);
      else local.delete(word);
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...local]));
    }
  }, []);

  return { saved, toggle };
}
