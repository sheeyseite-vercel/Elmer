import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listProviders } from "@/lib/data/ai-providers";
import { isEncryptionConfigured } from "@/lib/crypto";
import { redirect } from "next/navigation";
import { ProviderManager } from "./provider-manager";

export const metadata = { title: "AI providers" };

export default async function AiProvidersPage() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const providers = await listProviders(business.id);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/settings" className="text-sm text-accent underline">← Settings</Link>
        <h1 className="text-2xl font-semibold">AI providers</h1>
        <p className="text-sm text-muted">
          Add one or more providers and choose which one the AI analyst uses. Keys are encrypted on the server and are
          never shown again after saving.
        </p>
      </div>
      <ProviderManager providers={providers} encryptionReady={isEncryptionConfigured()} />
    </div>
  );
}
