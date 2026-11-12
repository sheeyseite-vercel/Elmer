"use client";

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { clientAuth, isClientConfigured } from "@/lib/firebase/client";
import { useTr } from "@/lib/i18n/client";

export function LoginForm() {
  const tr = useTr();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isClientConfigured()) {
    return (
      <Card role="alert">
        Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* variables to <code>{tr(".env.local")}</code>{" "}{tr("(see README).")}</Card>
    );
  }

  async function finish(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Sign-in failed.");
    }
    window.location.assign("/dashboard");
  }

  async function run(fn: () => Promise<string>) {
    setBusy(true);
    setError(null);
    try {
      await finish(await fn());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void run(async () => {
            const cred = await signInWithEmailAndPassword(
              clientAuth(),
              String(fd.get("email")),
              String(fd.get("password")),
            );
            return cred.user.getIdToken();
          });
        }}
      >
        <TextField label={tr("Email")} name="email" type="email" autoComplete="email" required />
        <TextField label={tr("Password")} name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" className="w-full" disabled={busy}>{tr("Sign in")}</Button>
      </form>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const cred = await signInWithPopup(clientAuth(), new GoogleAuthProvider());
            return cred.user.getIdToken();
          })
        }
      >{tr("Continue with Google")}</Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
