import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Reader } from "@/components/reader/Reader";
import type { Article } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("title_en").eq("id", id).single();
  return { title: data ? `${data.title_en} — IELTS NewsSync` : "IELTS NewsSync" };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();

  if (error || !data) notFound();

  return <Reader article={data as Article} />;
}
