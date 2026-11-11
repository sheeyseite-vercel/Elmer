"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return <Button type="button" variant="ghost" className="min-h-11" onClick={() => window.print()}>Print / save as PDF</Button>;
}
