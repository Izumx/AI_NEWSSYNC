# IELTS NewsSync

AI-powered IELTS Reading preparation: a 50/50 split-screen reader with daily news,
sentence-aligned Russian translations, Academic Word List highlights, an AI tutor
and IELTS practice quizzes.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — design tokens as CSS variables (light/dark palettes in `src/app/globals.css`)
- **Supabase** — PostgreSQL + RLS (schema in `supabase/migrations/`), Auth-ready
- **Zustand** — reader UI state (`src/store/readerStore.ts`)
- **Framer Motion** — drawer/modal animations
- **Web Speech API** — pronunciation & article TTS (`src/lib/tts.ts`)

## Getting started

```bash
npm install
npm run dev
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Data model

| Table | Purpose |
| --- | --- |
| `articles` | Enriched articles: EN/RU paragraphs (AWL words marked `*word*` / `*word:перевод*`), vocabulary JSON, quiz JSON |
| `user_saved_words` | Per-user flashcards with SRS fields (`srs_stage`, `next_review_at`) |
| `user_quiz_attempts` | Quiz scores per article |

Paragraph markup is parsed by `src/lib/parse.ts` into plain/word segments; the
`key` of a word segment references the headword in `academic_vocabulary`.

## Roadmap

- [x] Step 1–2: split reader, sync scroll, word inspector, quiz, tutor UI
- [x] Step 3: streaming `/api/ai-tutor` route (Qwen via DashScope, OpenAI-compatible)
- [x] Step 4: `/api/cron/fetch-news` RSS ingestion + LLM enrichment
- [x] Step 5: `/flashcards` SM-2 reviewer + Anki CSV export
- [x] Supabase Auth (email magic link works out of the box; Google needs OAuth
      credentials in Supabase Dashboard → Authentication → Providers → Google)

## Auth

- `/login` — magic link (`signInWithOtp`) + Google OAuth button.
- `src/proxy.ts` refreshes the session on every request (Next 16 proxy).
- `/auth/callback` handles both `?code=` (PKCE) and `?token_hash=` links; the
  home page forwards a stray `?code=` if Supabase falls back to the Site URL.
- Sign-out: POST `/auth/signout`.

## Flashcards

`/flashcards` (sign-in required) reviews due words on an SM-2-style ladder
(`src/lib/srs.ts`: 10 min → 1 → 3 → 7 → 14 → 30 → 90 → 180 days; Again resets,
Hard repeats, Good +1, Easy +2). Grades update `srs_stage` / `next_review_at`
per user (RLS). “Export to Anki (.csv)” downloads front/back cards (HTML
formatting — enable “Allow HTML in fields” when importing).

## RSS pipeline

`GET /api/cron/fetch-news` (auth: `Authorization: Bearer $CRON_SECRET`) pulls BBC
and Guardian science feeds, extracts full text with Readability, asks Qwen to
produce the enriched bilingual JSON (5 paragraphs, AWL markup, vocabulary, 3
IELTS questions) and inserts via the `ingest_article()` SECURITY DEFINER
function (secret-gated — the anon key has no direct INSERT on `articles`).
Duplicates are skipped by `source_url`; max 2 articles per run. `vercel.json`
schedules it daily at 05:00 UTC when deployed to Vercel.
