"use client";

import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { clientAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ label }: { label: string }) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={async () => {
        await fetch("/api/auth/session", { method: "DELETE" });
        await signOut(clientAuth()).catch(() => {});
        window.location.assign("/login");
      }}
    >
      <LogOut size={18} aria-hidden /> {label}
    </Button>
  );
}
