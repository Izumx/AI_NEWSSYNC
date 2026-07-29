-- Secure ingestion path for the RSS pipeline: the anon key cannot insert into
-- articles directly (RLS), so the cron route calls this SECURITY DEFINER
-- function with a secret stored in a private schema.
-- Applied 2026-07-29 via Supabase MCP. The real secret in private.config
-- matches INGEST_SECRET in .env.local (placeholder below).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.config (
  key text primary key,
  value text not null
);

insert into private.config (key, value)
values ('ingest_secret', '<INGEST_SECRET>');

create or replace function public.ingest_article(secret text, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
  existing_id uuid;
  new_id uuid;
begin
  select value into expected from private.config where key = 'ingest_secret';
  if expected is null or secret is distinct from expected then
    raise exception 'invalid ingest secret';
  end if;

  select id into existing_id
  from public.articles
  where source_url = payload->>'source_url'
  limit 1;
  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.articles (
    title_en, title_ru, source_name, source_url, published_at,
    band_score_target, category, paragraphs_en, paragraphs_ru,
    academic_vocabulary, quiz_questions, reading_time_minutes
  ) values (
    payload->>'title_en',
    payload->>'title_ru',
    payload->>'source_name',
    payload->>'source_url',
    nullif(payload->>'published_at', '')::timestamptz,
    payload->>'band_score_target',
    payload->>'category',
    coalesce(payload->'paragraphs_en', '[]'::jsonb),
    coalesce(payload->'paragraphs_ru', '[]'::jsonb),
    coalesce(payload->'academic_vocabulary', '[]'::jsonb),
    coalesce(payload->'quiz_questions', '[]'::jsonb),
    nullif(payload->>'reading_time_minutes', '')::int
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke execute on function public.ingest_article(text, jsonb) from public;
grant execute on function public.ingest_article(text, jsonb) to anon, authenticated;
