import Parser from "rss-parser";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
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
  const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
  if (!res.ok) return null;
  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const parsed = new Readability(dom.window.document).parse();
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

  const ingested: { id: string; title: string; source: string }[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const feed of FEEDS) {
    if (ingested.length >= MAX_PER_RUN) break;

    let items: { title?: string; link?: string; isoDate?: string }[];
    try {
      const parsed = await parser.parseURL(feed.url);
      items = parsed.items ?? [];
    } catch (e) {
      errors.push(`${feed.name}: RSS fetch failed (${(e as Error).message})`);
      continue;
    }

    for (const item of items.slice(0, 8)) {
      if (ingested.length >= MAX_PER_RUN) break;
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

        const enriched = await enrichArticle(item.title ?? extracted.title, extracted.text);

        const { data: id, error } = await supabase.rpc("ingest_article", {
          secret: ingestSecret,
          payload: {
            ...enriched,
            source_name: feed.name,
            source_url: link,
            published_at: item.isoDate ?? new Date().toISOString(),
          },
        });
        if (error) throw new Error(`DB insert failed: ${error.message}`);

        ingested.push({ id: id as string, title: enriched.title_en, source: feed.name });
      } catch (e) {
        errors.push(`${feed.name}: ${item.title} — ${(e as Error).message}`);
      }
    }
  }

  return Response.json({ ingested, skipped, errors });
}
