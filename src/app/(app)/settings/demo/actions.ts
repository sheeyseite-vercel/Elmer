"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { DEMO_COOKIE } from "@/lib/data/business";
import { purgeDemo, seedDemo } from "@/lib/demo/seed";

const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 };

export async function startDemo(): Promise<void> {
  const user = await requireUser();
  await seedDemo(user.uid);
  (await cookies()).set(DEMO_COOKIE, "1", opts);
  await adminDb().collection("audit_logs").add({ businessId: `demo_${user.uid}`, actorUid: user.uid, action: "demo.started", createdAt: new Date().toISOString() });
  redirect("/dashboard");
}

export async function exitDemo(): Promise<void> {
  await requireUser();
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/settings");
}

export async function deleteDemo(): Promise<void> {
  const user = await requireUser();
  await purgeDemo(user.uid);
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/settings");
}
