"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** A submit button that shows at once that the click was received. */
export function SubmitButton({ idle, busy, variant }: { idle: string; busy: string; variant?: "primary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}
