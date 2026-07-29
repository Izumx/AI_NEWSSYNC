import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { plainText } from "@/lib/parse";
import type { Article } from "@/lib/types";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 20;
const MAX_MESSAGE_LENGTH = 4000;

function buildSystemPrompt(article: Article): string {
  const paragraphs = article.paragraphs_en
    .map((p, i) => `[${"ABCDEFGHIJ"[i] ?? i + 1}] ${plainText(p)}`)
    .join("\n\n");
  const vocab = article.academic_vocabulary.map((v) => v.word).join(", ");

  return `You are an experienced IELTS Academic tutor inside the "IELTS NewsSync" reading app. The student is a Russian speaker preparing for IELTS Reading (target band ${article.band_score_target ?? "7+"}).

The student is currently reading this article (paragraphs are labelled A, B, C…):

TITLE: ${article.title_en}

${paragraphs}

Academic Word List terms highlighted in the app: ${vocab}.

Guidelines:
- Plain text only — NO Markdown (no **, no #, no tables). Use simple bullets like "•" and blank lines for structure.
- Answer in English by default; if the student writes in Russian, you may add short Russian glosses for difficult terms, but keep the teaching content in English.
- Be concise and practical: use short bullet points, concrete examples from THIS article, and IELTS-specific advice (paraphrasing, T/F/NG logic, scanning skills).
- When explaining grammar, name the construction and show one extra example the student can imitate.
- Never invent facts that are not in the article; if asked something outside the article, answer briefly and steer back to reading practice.`;
}

export async function POST(req: Request) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI tutor is not configured" }, { status: 503 });
  }

  let body: { articleId?: string; messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { articleId, messages } = body;
  if (!articleId || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "articleId and messages are required" }, { status: 400 });
  }

  const history = messages
    .filter(
      (m): m is ChatMessage =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ ...m, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  const supabase = await createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();

  if (error || !article) {
    return Response.json({ error: "Article not found" }, { status: 404 });
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  });

  const stream = await client.chat.completions.create({
    model: process.env.QWEN_MODEL ?? "qwen3.7-plus",
    messages: [{ role: "system", content: buildSystemPrompt(article as Article) }, ...history],
    stream: true,
    max_tokens: 1200,
    // DashScope-specific: disable the deep-thinking phase for fast replies.
    ...({ enable_thinking: false } as Record<string, unknown>),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
