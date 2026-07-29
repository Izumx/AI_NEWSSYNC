-- IELTS NewsSync initial schema
-- Applied to project mlvghjtubqblqmjkkuyz on 2026-07-29 via Supabase MCP.

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ru text,
  source_name text,
  source_url text,
  published_at timestamptz,
  band_score_target text,
  category text,
  paragraphs_en jsonb not null default '[]'::jsonb,
  paragraphs_ru jsonb not null default '[]'::jsonb,
  academic_vocabulary jsonb not null default '[]'::jsonb,
  quiz_questions jsonb not null default '[]'::jsonb,
  reading_time_minutes int,
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;

create policy "Articles are readable by everyone"
  on public.articles for select
  using (true);

create index articles_published_at_idx on public.articles (published_at desc);

create table public.user_saved_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  ipa text,
  translation text,
  definition text,
  context_sentence text,
  srs_stage int not null default 0,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, word)
);

alter table public.user_saved_words enable row level security;

create policy "Users can view own saved words"
  on public.user_saved_words for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own saved words"
  on public.user_saved_words for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own saved words"
  on public.user_saved_words for update
  using ((select auth.uid()) = user_id);

create policy "Users can delete own saved words"
  on public.user_saved_words for delete
  using ((select auth.uid()) = user_id);

create index user_saved_words_review_idx on public.user_saved_words (user_id, next_review_at);

create table public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  score int not null,
  total_questions int not null,
  time_spent_seconds int,
  created_at timestamptz not null default now()
);

alter table public.user_quiz_attempts enable row level security;

create policy "Users can view own quiz attempts"
  on public.user_quiz_attempts for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own quiz attempts"
  on public.user_quiz_attempts for insert
  with check ((select auth.uid()) = user_id);
