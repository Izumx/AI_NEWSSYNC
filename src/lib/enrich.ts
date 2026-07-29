import OpenAI from "openai";
import type { QuizQuestion, VocabEntry } from "./types";

export interface EnrichedArticle {
  title_en: string;
  title_ru: string;
  category: string;
  band_score_target: string;
  reading_time_minutes: number;
  paragraphs_en: string[];
  paragraphs_ru: string[];
  academic_vocabulary: VocabEntry[];
  quiz_questions: QuizQuestion[];
}

const MAX_SOURCE_CHARS = 6000;

const ENRICH_PROMPT = `You are an expert IELTS Academic content creator for the "IELTS NewsSync" app (English news + aligned Russian translation for Russian-speaking IELTS candidates).

You will receive a raw news article. Produce a single JSON object with EXACTLY these keys:

{
  "title_en": string,            // cleaned English headline
  "title_ru": string,            // natural Russian translation of the headline
  "category": string,            // one of: "Science & Tech", "Economy", "Society", "Environment", "Health", "Culture", "Politics"
  "band_score_target": string,   // "6.5+", "7.0+", "7.5+" or "8.0+" judged by lexical difficulty
  "reading_time_minutes": number,// total words / 200, rounded up
  "paragraphs_en": string[],     // exactly 5 paragraphs, see rules
  "paragraphs_ru": string[],     // exactly 5 aligned Russian paragraphs
  "academic_vocabulary": [       // 6-8 entries
    {
      "word": string,            // lowercase English headword from the Academic Word List (or C1/C2 academic vocabulary) that appears in your paragraphs_en
      "ipa": string,             // e.g. "/juːˈbɪk.wɪ.təs/"
      "cefr": string,            // "B2", "C1" or "C2"
      "pos": string,             // "noun", "verb", "adjective", "adverb"
      "def_en": string,          // concise English definition (Cambridge style)
      "trans_ru": string,        // Russian translation(s)
      "collocations": string[],  // 3 common collocations
      "context_sentence": string // one original IELTS-style example sentence (NOT from the article)
    }
  ],
  "quiz_questions": [            // exactly 3 IELTS Reading questions
    {
      "id": number,              // 1, 2, 3
      "type": string,            // "True / False / Not Given", "Matching Information" or "Multiple Choice" — use each type once
      "question": string,
      "options": string[],       // for T/F/NG: ["True","False","Not Given"]; for Matching: ["Paragraph A"... "Paragraph E"]; for MC: 4 options
      "correct_answer": number,  // 0-based index into options
      "explanation": string      // why, citing the paragraph letter
    }
  ]
}

Paragraph rules:
- Rewrite/condense the article into EXACTLY 5 paragraphs of academic English (IELTS Reading register), 60-110 words each, preserving all key facts. Do not invent facts.
- Mark each academic_vocabulary word at its FIRST occurrence in paragraphs_en by wrapping it in asterisks: *word*. Every vocabulary entry MUST appear marked exactly once somewhere in paragraphs_en.
- paragraphs_ru[i] must be an accurate, natural literary Russian translation of paragraphs_en[i].
- In paragraphs_ru, mark the translation of each marked word as *word:перевод*, where "word" is the English headword (lowercase, exactly as in academic_vocabulary) and "перевод" is the inflected Russian word(s) as used in the sentence. Example: "...вкладывают *unprecedented:беспрецедентные* суммы...".
- No other asterisks anywhere.

Answer ONLY with the JSON object.`;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string");
}

function validate(data: Record<string, unknown>): string | null {
  if (typeof data.title_en !== "string" || typeof data.title_ru !== "string")
    return "missing titles";
  if (!isStringArray(data.paragraphs_en) || !isStringArray(data.paragraphs_ru))
    return "missing paragraphs";
  if (data.paragraphs_en.length !== data.paragraphs_ru.length)
    return "EN/RU paragraph count mismatch";
  const vocab = data.academic_vocabulary;
  if (!Array.isArray(vocab) || vocab.length < 4) return "too few vocabulary entries";
  const quiz = data.quiz_questions;
  if (!Array.isArray(quiz) || quiz.length !== 3) return "quiz must have 3 questions";
  for (const q of quiz as QuizQuestion[]) {
    if (
      !Array.isArray(q.options) ||
      typeof q.correct_answer !== "number" ||
      q.correct_answer < 0 ||
      q.correct_answer >= q.options.length
    )
      return "invalid quiz question";
  }
  return null;
}

export async function enrichArticle(
  rawTitle: string,
  rawText: string,
): Promise<EnrichedArticle> {
  try {
    return await enrichOnce(rawTitle, rawText);
  } catch {
    // LLM output is occasionally malformed; one retry fixes most cases.
    return enrichOnce(rawTitle, rawText);
  }
}

async function enrichOnce(rawTitle: string, rawText: string): Promise<EnrichedArticle> {
  const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  });

  const completion = await client.chat.completions.create({
    model: process.env.QWEN_MODEL ?? "qwen3.7-plus",
    messages: [
      { role: "system", content: ENRICH_PROMPT },
      {
        role: "user",
        content: `TITLE: ${rawTitle}\n\nARTICLE:\n${rawText.slice(0, MAX_SOURCE_CHARS)}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 8000,
    ...({ enable_thinking: false } as Record<string, unknown>),
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("empty LLM response");

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  const problem = validate(data);
  if (problem) throw new Error(`LLM output failed validation: ${problem}`);

  return data as unknown as EnrichedArticle;
}
