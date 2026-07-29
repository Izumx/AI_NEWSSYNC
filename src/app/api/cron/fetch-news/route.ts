import Parser from "rss-parser";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { createClient } from "@/lib/supabase/server";
import { enrichArticle } from "@/lib/enrich";

export const maxDuration = 300;

const FEEDS = [
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
  { name: "The Guardian", url: "https://www.theguardian.com/science/rss" },
];

/** How many new articles to ingest per run (LLM enrichment is slow). */
const MAX_PER_RUN = 2;
const MIN_TEXT_CHARS = 1500;

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

async function extractArticle(url: string): Promise<{ title: string; text: string } | null> {
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return null;
  const html = await res.text();
  const { document } = parseHTML(html);
  // Readability types expect a browser Document; linkedom's is API-compatible
  // for what Readability uses.
  const parsed = new Readability(document as unknown as Document).parse();
  if (!parsed?.textContent) return null;
  const text = parsed.textContent.replace(/\s+/g, " ").trim();
  if (text.length < MIN_TEXT_CHARS) return null;
  return { title: parsed.title || "", text };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ingestSecret = process.env.INGEST_SECRET;
  if (!ingestSecret || !process.env.DASHSCOPE_API_KEY) {
    return Response.json({ error: "Pipeline is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const parser = new Parser({ timeout: 15000 });

  const skipped: string[] = [];
  const errors: string[] = [];

  // Phase 1 (sequential, fast): walk the feeds and collect up to MAX_PER_RUN
  // fresh articles with successfully extracted text.
  interface Candidate {
    source: string;
    link: string;
    title: string;
    text: string;
    publishedAt: string;
  }
  const candidates: Candidate[] = [];

  for (const feed of FEEDS) {
    if (candidates.length >= MAX_PER_RUN) break;

    let items: { title?: string; link?: string; isoDate?: string }[];
    try {
      const parsed = await parser.parseURL(feed.url);
      items = parsed.items ?? [];
    } catch (e) {
      errors.push(`${feed.name}: RSS fetch failed (${(e as Error).message})`);
      continue;
    }

    for (const item of items.slice(0, 8)) {
      if (candidates.length >= MAX_PER_RUN) break;
      const link = item.link;
      if (!link) continue;

      const { data: existing } = await supabase
        .from("articles")
        .select("id")
        .eq("source_url", link)
        .maybeSingle();
      if (existing) {
        skipped.push(`${feed.name}: already ingested — ${item.title}`);
        continue;
      }

      try {
        const extracted = await extractArticle(link);
        if (!extracted) {
          skipped.push(`${feed.name}: could not extract text — ${item.title}`);
          continue;
        }
        candidates.push({
          source: feed.name,
          link,
          title: item.title ?? extracted.title,
          text: extracted.text,
          publishedAt: item.isoDate ?? new Date().toISOString(),
        });
      } catch (e) {
        errors.push(`${feed.name}: ${item.title} — ${(e as Error).message}`);
      }
    }
  }

  // Phase 2: enrich candidates in parallel — LLM generation dominates the run
  // time and the whole route must fit in Vercel's 300 s window.
  const results = await Promise.allSettled(
    candidates.map(async (c) => {
      const enriched = await enrichArticle(c.title, c.text);
      const { data: id, error } = await supabase.rpc("ingest_article", {
        secret: ingestSecret,
        payload: {
          ...enriched,
          source_name: c.source,
          source_url: c.link,
          published_at: c.publishedAt,
        },
      });
      if (error) throw new Error(`DB insert failed: ${error.message}`);
      return { id: id as string, title: enriched.title_en, source: c.source };
    }),
  );

  const ingested: { id: string; title: string; source: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") ingested.push(r.value);
    else errors.push(`${candidates[i].source}: ${candidates[i].title} — ${r.reason?.message ?? r.reason}`);
  });

  return Response.json({ ingested, skipped, errors });
}
