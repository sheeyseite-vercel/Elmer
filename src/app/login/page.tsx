import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const { tr } = await getT();
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted">{tr("ELMER Business Intelligence")}</p>
        <h1 className="text-2xl font-semibold">{tr("Sign in")}</h1>
      </div>
      <LoginForm />
    </main>
  );
}
