"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteTermMonth } from "./actions";

export function DeleteMonthButton({ month }: { month: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      className="min-h-11 px-2 text-danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Delete all saved phrases for ${month}?`)) start(async () => void (await deleteTermMonth(month)));
      }}
    >
      Delete month
    </Button>
  );
}
