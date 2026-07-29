import Link from "next/link";
import { LogIn, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FlashcardReviewer } from "@/components/flashcards/FlashcardReviewer";
import type { SavedWord } from "@/lib/types";

export const metadata = { title: "Flashcards — IELTS NewsSync" };

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-7 text-center [box-shadow:var(--shadow)]">
          <h1 className="mb-1.5 text-[17px] font-bold">Sign in to review flashcards</h1>
          <p className="mb-5 text-[13px] leading-relaxed text-[var(--text2)]">
            Your saved words sync to your account so you can review them with spaced repetition on
            any device.
          </p>
          <Link
            href="/login"
            className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-[var(--acc)] text-[13.5px] font-semibold text-white no-underline transition-all hover:brightness-110"
          >
            <LogIn size={15} />
            Sign in
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[var(--text2)] no-underline hover:text-[var(--acc)]"
          >
            <ArrowLeft size={14} />
            Back to reading
          </Link>
        </div>
      </main>
    );
  }

  const { data: words } = await supabase
    .from("user_saved_words")
    .select("*")
    .order("next_review_at", { ascending: true });

  return <FlashcardReviewer initialWords={(words ?? []) as SavedWord[]} />;
}
