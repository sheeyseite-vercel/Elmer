import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { OnboardingWizard } from "./wizard";

export const metadata = { title: "Set up your business" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await getBusinessForUser(user.uid, { real: true });
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-8">
      <OnboardingWizard
        defaults={
          existing
            ? {
                name: existing.name,
                city: existing.city,
                address: existing.address,
                serviceArea: existing.serviceArea,
                primaryLanguage: existing.primaryLanguage,
                phone: existing.phone,
                website: existing.website,
                bookingUrl: existing.bookingUrl,
                profileUrl: existing.profileUrl,
                latitude: existing.latitude?.toString() ?? "",
                longitude: existing.longitude?.toString() ?? "",
                reportingCadence: existing.reportingCadence,
              }
            : undefined
        }
      />
    </main>
  );
}
