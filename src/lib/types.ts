export interface VocabEntry {
  word: string;
  ipa: string;
  cefr: string;
  pos: string;
  def_en: string;
  trans_ru: string;
  collocations: string[];
  context_sentence: string;
}

export interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  /** Index into `options`. */
  correct_answer: number;
  explanation: string;
}

export interface Article {
  id: string;
  title_en: string;
  title_ru: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  band_score_target: string | null;
  category: string | null;
  paragraphs_en: string[];
  paragraphs_ru: string[];
  academic_vocabulary: VocabEntry[];
  quiz_questions: QuizQuestion[];
  reading_time_minutes: number | null;
}

export interface SavedWord {
  id: string;
  user_id: string;
  word: string;
  ipa: string | null;
  translation: string | null;
  definition: string | null;
  context_sentence: string | null;
  srs_stage: number;
  next_review_at: string;
  created_at: string;
}

/**
 * A parsed piece of paragraph text. AWL words are wrapped in asterisks in the
 * stored markup: `*word*` in English, `*word:отображаемый текст*` in Russian —
 * `key` always refers to the English headword in `academic_vocabulary`.
 */
export type Segment =
  | { kind: "plain"; text: string }
  | { kind: "word"; key: string; text: string };
