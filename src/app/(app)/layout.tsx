import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return <AppShell businessName={business.name}>{children}</AppShell>;
}
