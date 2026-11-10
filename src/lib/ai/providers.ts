import { z } from "zod";

/**
 * All presets speak the OpenAI-compatible chat API, so one adapter serves them all
 * and "custom" lets the owner add any other compatible provider.
 * Base URLs and default model names change over time: verify them against each
 * provider's documentation and edit the model field if a default is retired.
 */
export const PROVIDER_KINDS = ["gemini", "groq", "openrouter", "custom"] as const;
export type ProviderKind = (typeof PROVIDER_KINDS)[number];

export const PRESETS: Record<ProviderKind, { label: string; baseUrl: string; model: string }> = {
  gemini: {
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
  },
  groq: {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/auto",
  },
  custom: { label: "Custom (OpenAI-compatible)", baseUrl: "", model: "" },
};

/** Public view of a provider. The API key is never included, only its last 4 characters. */
export type ProviderView = {
  id: string;
  kind: ProviderKind;
  label: string;
  baseUrl: string;
  model: string;
  keyLast4: string;
  active: boolean;
  lastTest?: { ok: boolean; at: string; detail: string };
};

/** Blocks non-HTTPS and obviously internal hosts (basic SSRF guard for custom providers). */
export function isSafeBaseUrl(value: string): boolean {
  let u: URL;
  try {
    u = new URL(value);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.includes(":")) return false;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return false;
    }
  }
  return true;
}

export const providerInput = z.object({
  id: z.string().trim().max(60).optional(),
  kind: z.enum(PROVIDER_KINDS),
  label: z.string().trim().min(1, "Enter a name").max(60),
  baseUrl: z
    .string()
    .trim()
    .max(300)
    .refine(isSafeBaseUrl, "Must be a public https:// URL"),
  model: z.string().trim().min(1, "Enter a model name").max(120),
  apiKey: z.string().trim().max(500).optional(),
});
