import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listTasks } from "@/lib/data/profile";
import { HELP_URL, ITEMS } from "@/lib/profile-checklist";
import { TaskRow } from "./task-row";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Profile checklist" };

export default async function ChecklistPage() {
  const { tr } = await getT();
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const tasks = await listTasks(business.id);

  // Facts from the owner's own saved details; they are prompts to verify, never proof about the live profile.
  const hints: Record<string, string> = {
    name_category: `the business name is “${business.name}”.`,
    phone_website:
      [business.phone ? "a phone number is saved" : "no phone number is saved", business.website ? "a website is saved" : "no website is saved"].join("; ") +
      ". Confirm they match the live profile.",
    address_area: `${business.address ? "an address is saved" : "no address is saved"}${business.serviceArea ? "; a service area is saved" : ""}. Confirm it matches the live profile.`,
    booking: business.bookingUrl ? "a booking link is saved. Confirm it matches the live profile." : "no booking link is saved.",
  };

  const counts = { complete: 0, needs_attention: 0, unknown: 0 };
  for (const item of ITEMS) counts[tasks.get(item.key)?.status ?? "unknown"]++;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Profile checklist")}</h1>
        <p className="text-sm text-muted">
          A practical list for keeping your Google Business Profile accurate. You set each status yourself; this app
          cannot see or edit your live profile, and an item stays <strong>{tr("Unknown")}</strong>{" "}{tr("until you review it.")}</p>
      </div>

      <Card className="space-y-1">
        <p className="text-sm">
          {counts.complete} complete · {counts.needs_attention} need attention · {counts.unknown} unknown (of {ITEMS.length})
        </p>
        <p className="text-xs text-muted">
          This is a to-do list, not a score, and finishing it does not promise higher rankings or more customers. For
          Google&apos;s own instructions, see the{" "}
          <a href={HELP_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline">{tr("Google Business Profile Help")}</a>.
        </p>
      </Card>

      {ITEMS.map((item) => (
        <TaskRow key={item.key} item={item} task={tasks.get(item.key)} hint={hints[item.key]} />
      ))}
    </div>
  );
}
