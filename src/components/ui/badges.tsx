import { cn } from "@/lib/utils";

export type SourceKind = "google_api" | "google_csv" | "manual" | "external_provider";

const sourceText: Record<SourceKind, string> = {
  google_api: "Official Google API",
  google_csv: "Imported Google CSV",
  manual: "Manually entered",
  external_provider: "External provider",
};

/** Every dataset must show where it came from (product rule 2). */
export function SourceBadge({ kind, detail, tr }: { kind: SourceKind; detail?: string; tr?: (t: string) => string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
      <span className="font-medium text-text">{tr ? tr(sourceText[kind]) : sourceText[kind]}</span>
      {detail ? <span>· {detail}</span> : null}
    </span>
  );
}

type Tone = "success" | "warning" | "danger" | "neutral";
const tones: Record<Tone, string> = {
  success: "text-success border-success/40",
  warning: "text-warning border-warning/40",
  danger: "text-danger border-danger/40",
  neutral: "text-neutral border-border",
};

export function StatusBadge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
