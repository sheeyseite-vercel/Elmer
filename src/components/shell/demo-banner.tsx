import { exitDemo } from "@/app/(app)/settings/demo/actions";

export function DemoBanner() {
  return (
    <div role="status" className="no-print sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-warning bg-surface px-4 py-2 md:top-0 md:-mx-8 md:px-8">
      <p className="text-sm font-medium">DEMO MODE: every number here is invented. Your real data is untouched.</p>
      <form action={exitDemo}>
        <button type="submit" className="min-h-11 rounded-xl border border-border px-3 text-sm">Exit demo</button>
      </form>
    </div>
  );
}
