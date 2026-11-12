"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteReport } from "../actions";
import { useTr } from "@/lib/i18n/client";

export function DeleteReportButton({ id }: { id: string }) {
  const tr = useTr();
  const [pending, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="min-h-11 text-danger" disabled={pending}
      onClick={() => { if (window.confirm(tr("Delete this report?"))) start(async () => void (await deleteReport(id))); }}>{tr("Delete")}</Button>
  );
}
