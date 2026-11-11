"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteLeadEntry } from "./actions";

export function DeleteLeadButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      className="min-h-11 px-2 text-danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm("Delete this entry?")) start(async () => void (await deleteLeadEntry(id)));
      }}
    >
      Delete
    </Button>
  );
}
