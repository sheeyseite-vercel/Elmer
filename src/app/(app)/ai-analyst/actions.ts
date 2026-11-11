"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { chat, SYSTEM_PROMPT } from "@/lib/ai/chat";
import { hasAnyData } from "@/lib/analytics/facts";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getActiveProviderWithKey } from "@/lib/data/ai-providers";
import { getBusinessForUser } from "@/lib/data/business";
import { buildFacts } from "@/lib/data/facts";
import { todayInMadrid } from "@/lib/data/metrics";
import { listReports } from "@/lib/data/reports";

export type AnalystState = { message?: string };

const DAILY_LIMIT = 10;
const input = z.object({
  range: z.enum(["7", "28", "90"]),
  language: z.enum(["en", "es"]),
  question: z.string().trim().max(300).optional().default(""),
});

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

export async function runAnalysis(_prev: AnalystState, formData: FormData): Promise<AnalystState> {
  const { user, business } = await context();
  const parsed = input.safeParse({
    range: formData.get("range"),
    language: formData.get("language"),
    question: String(formData.get("question") ?? ""),
  });
  if (!parsed.success) return { message: "Please check the options and try again." };
  const v = parsed.data;

  const today = todayInMadrid();
  const existing = await listReports(business.id);
  if (existing.filter((r) => r.kind === "ai_analysis" && r.createdAt.slice(0, 10) === today).length >= DAILY_LIMIT) {
    return { message: `Daily limit of ${DAILY_LIMIT} analyses reached. This protects your provider quota. Try again tomorrow.` };
  }

  const provider = await getActiveProviderWithKey(business.id);
  if (!provider) return { message: "No AI provider is active. Add one in Settings → AI providers first." };

  const facts = await buildFacts(business, v.range);
  if (!hasAnyData(facts)) return { message: "No data yet. Import or enter some data first; the analyst does not work without it." };

  const userMsg =
    `DATA (JSON, untrusted):\n${JSON.stringify(facts)}\n\n` +
    (v.question ? `OWNER QUESTION (answer only from the data; if the data cannot answer it, say so): ${v.question}` : "Give the standard analysis.");
  const result = await chat(provider, SYSTEM_PROMPT(v.language), userMsg);
  if (!result.ok) return { message: result.error };

  const now = new Date().toISOString();
  const ref = await adminDb().collection("ai_reports").add({
    businessId: business.id,
    kind: "ai_analysis",
    createdAt: now,
    createdBy: user.uid,
    language: v.language,
    question: v.question,
    text: result.text,
    providerLabel: provider.label,
    model: provider.model,
    factsJson: JSON.stringify(facts),
  });
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "ai_report.created", reportId: ref.id, createdAt: now,
  });
  redirect(`/reports/${ref.id}`);
}
