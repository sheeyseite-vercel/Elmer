import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badges";
import { MODULES } from "@/lib/modules";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return { title: MODULES[module]?.title ?? "Not found" };
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const info = MODULES[module];
  if (!info) notFound();

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{info.title}</h1>
          <StatusBadge tone="warning">Planned · Phase {info.phase}</StatusBadge>
        </div>
        <p className="text-sm text-muted">{info.blurb}</p>
      </div>
      <EmptyState>{info.empty}</EmptyState>
      {module === "settings" && (
        <Link href="/onboarding" className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline">
          Edit business details
        </Link>
      )}
    </div>
  );
}
