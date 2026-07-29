"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthControls() {
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
      setLoaded(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Link
        href="/flashcards"
        title="Review saved words (SRS flashcards)"
        className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-[12.5px] font-semibold text-[var(--text2)] no-underline transition-all hover:border-[var(--accbrd)]"
      >
        <GraduationCap size={15} />
        Flashcards
      </Link>
      {!loaded ? null : email ? (
        <form action="/auth/signout" method="post" className="flex">
          <button
            type="submit"
            title={`Signed in as ${email} — click to sign out`}
            className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-[12.5px] font-semibold text-[var(--text2)] transition-all hover:border-[var(--accbrd)]"
          >
            <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[var(--accbg)] text-[10.5px] font-bold text-[var(--acc)]">
              {email[0].toUpperCase()}
            </span>
            <LogOut size={13} />
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          title="Sign in"
          className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-[12.5px] font-semibold text-[var(--text2)] no-underline transition-all hover:border-[var(--accbrd)]"
        >
          <LogIn size={15} />
          Sign In
        </Link>
      )}
    </>
  );
}
