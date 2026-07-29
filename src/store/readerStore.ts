import { create } from "zustand";

interface ReaderState {
  dark: boolean;
  serif: boolean;
  sync: boolean;
  ttsPlaying: boolean;
  inspectorKey: string | null;
  tutorOpen: boolean;
  quizOpen: boolean;
  toggleDark: () => void;
  setSerif: (serif: boolean) => void;
  toggleSync: () => void;
  setTtsPlaying: (playing: boolean) => void;
  setInspectorKey: (key: string | null) => void;
  toggleTutor: () => void;
  setQuizOpen: (open: boolean) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  dark: false,
  serif: false,
  sync: true,
  ttsPlaying: false,
  inspectorKey: null,
  tutorOpen: false,
  quizOpen: false,
  toggleDark: () => set((s) => ({ dark: !s.dark })),
  setSerif: (serif) => set({ serif }),
  toggleSync: () => set((s) => ({ sync: !s.sync })),
  setTtsPlaying: (ttsPlaying) => set({ ttsPlaying }),
  setInspectorKey: (inspectorKey) => set({ inspectorKey }),
  toggleTutor: () => set((s) => ({ tutorOpen: !s.tutorOpen })),
  setQuizOpen: (quizOpen) => set({ quizOpen }),
}));
