"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.37c1.62 0 3.06.56 4.2 1.64l3.16-3.16A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error") === "link";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("sent");
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white">
            <BookOpen size={19} />
          </div>
          <div className="text-[19px] font-bold tracking-tight">
            IELTS <span className="text-[var(--acc)]">NewsSync</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-7 [box-shadow:var(--shadow)]">
          {status === "sent" ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--greenbg)] text-[var(--green)]">
                <Mail size={20} />
              </div>
              <h1 className="mb-1.5 text-[17px] font-bold">Check your email</h1>
              <p className="text-[13px] leading-relaxed text-[var(--text2)]">
                We sent a sign-in link to <span className="font-semibold">{email}</span>. Open it on
                this device to continue.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-[17px] font-bold">Sign in</h1>
              <p className="mb-5 text-[13px] text-[var(--text2)]">
                Save words to flashcards and track your quiz progress.
              </p>

              {linkError && (
                <div className="mb-4 rounded-lg border border-[var(--redbrd)] bg-[var(--redbg)] px-3 py-2.5 text-[12.5px] text-[var(--red)]">
                  That sign-in link is invalid or has expired. Please request a new one.
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-lg border border-[var(--redbrd)] bg-[var(--redbg)] px-3 py-2.5 text-[12.5px] text-[var(--red)]">
                  {error}
                </div>
              )}

              <button
                onClick={signInWithGoogle}
                className="mb-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-[var(--border)] bg-[var(--panel)] text-[13.5px] font-semibold text-[var(--text)] transition-all hover:border-[var(--accbrd)]"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text3)]">
                  or
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <form onSubmit={sendMagicLink}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mb-3 h-10 w-full rounded-[9px] border border-[var(--border)] bg-[var(--bg)] px-3 text-[13.5px] text-[var(--text)] outline-none transition-colors focus:border-[var(--acc)]"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[9px] border-none bg-[var(--acc)] text-[13.5px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                >
                  <Mail size={15} />
                  {status === "sending" ? "Sending…" : "Send magic link"}
                </button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[var(--text2)] no-underline hover:text-[var(--acc)]"
        >
          <ArrowLeft size={14} />
          Back to reading
        </Link>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
