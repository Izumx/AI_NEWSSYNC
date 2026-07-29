import { create } from "zustand";

export type ReadingMode = "en" | "bi" | "ru";

interface ReaderState {
  dark: boolean;
  serif: boolean;
  sync: boolean;
  ttsPlaying: boolean;
  inspectorKey: string | null;
  tutorOpen: boolean;
  quizOpen: boolean;
  /** Mobile only: reading-mode switcher (English / Bilingual / Russian). */
  mode: ReadingMode;
  /** Mobile only: "saved words from this article" sheet. */
  vocabOpen: boolean;
  toggleDark: () => void;
  setSerif: (serif: boolean) => void;
  toggleSync: () => void;
  setTtsPlaying: (playing: boolean) => void;
  setInspectorKey: (key: string | null) => void;
  toggleTutor: () => void;
  setTutorOpen: (open: boolean) => void;
  setQuizOpen: (open: boolean) => void;
  setMode: (mode: ReadingMode) => void;
  setVocabOpen: (open: boolean) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  dark: false,
  serif: false,
  sync: true,
  ttsPlaying: false,
  inspectorKey: null,
  tutorOpen: false,
  quizOpen: false,
  mode: "bi",
  vocabOpen: false,
  toggleDark: () => set((s) => ({ dark: !s.dark })),
  setSerif: (serif) => set({ serif }),
  toggleSync: () => set((s) => ({ sync: !s.sync })),
  setTtsPlaying: (ttsPlaying) => set({ ttsPlaying }),
  setInspectorKey: (inspectorKey) => set({ inspectorKey }),
  toggleTutor: () => set((s) => ({ tutorOpen: !s.tutorOpen })),
  setTutorOpen: (tutorOpen) => set({ tutorOpen }),
  setQuizOpen: (quizOpen) => set({ quizOpen }),
  setMode: (mode) => set({ mode }),
  setVocabOpen: (vocabOpen) => set({ vocabOpen }),
}));
