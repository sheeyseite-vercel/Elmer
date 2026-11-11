"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteReport } from "../actions";

export function DeleteReportButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="min-h-11 text-danger" disabled={pending}
      onClick={() => { if (window.confirm("Delete this report?")) start(async () => void (await deleteReport(id))); }}>
      Delete
    </Button>
  );
}
