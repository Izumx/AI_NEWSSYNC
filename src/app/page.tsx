import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Clock, Sparkles, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AuthControls } from "@/components/reader/AuthControls";
import type { QuizQuestion, VocabEntry } from "@/lib/types";

interface ArticleRow {
  id: string;
  title_en: string;
  title_ru: string | null;
  source_name: string | null;
  published_at: string | null;
  band_score_target: string | null;
  category: string | null;
  reading_time_minutes: number | null;
  academic_vocabulary: VocabEntry[];
  quiz_questions: QuizQuestion[];
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // If Supabase falls back to the Site URL after email verification, the
  // auth code lands here — forward it to the callback route.
  const { code } = await searchParams;
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title_en, title_ru, source_name, published_at, band_score_target, category, reading_time_minutes, academic_vocabulary, quiz_questions",
    )
    .order("published_at", { ascending: false });

  const articles = (data ?? []) as ArticleRow[];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <header className="flex min-h-[60px] flex-none flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-[var(--border)] bg-[var(--panel)] px-5 py-2.5">
        <div className="flex flex-none items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
            <BookOpen size={17} />
          </div>
          <div className="whitespace-nowrap text-[15.5px] font-bold tracking-tight">
            IELTS <span className="text-[var(--acc)]">NewsSync</span>
          </div>
        </div>
        <span className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-[9px] py-[3px] text-xs font-semibold text-[var(--text2)]">
          {articles.length} {articles.length === 1 ? "article" : "articles"}
        </span>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2">
          <AuthControls />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[980px] flex-1 px-6 py-9">
        <h1 className="mb-1 text-[24px] font-bold tracking-tight">Daily Reading</h1>
        <p className="mb-7 text-[13.5px] text-[var(--text2)]">
          Fresh news with aligned Russian translations, academic vocabulary and IELTS practice
          questions. New articles arrive every day.
        </p>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-10 text-center">
            <h2 className="mb-1.5 text-[16px] font-bold">No articles yet</h2>
            <p className="text-[13px] text-[var(--text2)]">
              The daily ingestion pipeline has not run yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/article/${a.id}`}
                className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-[var(--accbrd)] hover:[box-shadow:var(--shadow)]"
              >
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {a.category && (
                    <span className="rounded-md bg-[var(--hl)] px-2 py-[3px] text-[11px] font-semibold text-[var(--hltext)]">
                      {a.category}
                    </span>
                  )}
                  {a.band_score_target && (
                    <span className="rounded-md border border-[var(--greenbrd)] bg-[var(--greenbg)] px-2 py-[3px] text-[11px] font-bold text-[var(--green)]">
                      Band {a.band_score_target}
                    </span>
                  )}
                  <div className="flex-1" />
                  <span className="text-[11.5px] text-[var(--text3)]">
                    {formatDate(a.published_at)}
                  </span>
                </div>

                <h2
                  className="mb-1 text-[17px] font-semibold leading-snug text-[var(--text)] [text-wrap:pretty] group-hover:text-[var(--acc)]"
                  style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
                >
                  {a.title_en}
                </h2>
                {a.title_ru && (
                  <p className="mb-4 text-[13px] leading-snug text-[var(--text2)] [text-wrap:pretty]">
                    {a.title_ru}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11.5px] font-semibold text-[var(--text3)]">
                  {a.source_name && <span>{a.source_name}</span>}
                  {a.reading_time_minutes != null && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {a.reading_time_minutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[var(--hltext)]">
                    <Sparkles size={12} />
                    {a.academic_vocabulary.length} AWL words
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardCheck size={12} />
                    {a.quiz_questions.length} questions
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
