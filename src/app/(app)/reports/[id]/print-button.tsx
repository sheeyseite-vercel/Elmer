"use client";

import { Button } from "@/components/ui/button";
import { useTr } from "@/lib/i18n/client";

export function PrintButton() {
  const tr = useTr();
  return <Button type="button" variant="ghost" className="min-h-11" onClick={() => window.print()}>{tr("Print / save as PDF")}</Button>;
}
