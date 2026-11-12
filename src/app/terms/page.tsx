import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Terms" };

const POINTS = [
  "This is a private internal tool for Elmer Osteopatia. Access is limited to approved owner accounts.",
  "Figures are only what was imported or typed, each labelled with its source. “Not recorded” means no data, not zero.",
  "A rank check is one observation at one place and time. Results change with location, device, language and personalisation. The app does not promise or guarantee rankings or customers.",
  "AI analysis is an estimate and can be wrong. Check it against the figures shown under it.",
  "The app never posts to Google, replies to reviews or changes your Google profile for you.",
];

export default async function TermsPage() {
  const { tr } = await getT();
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <Link href="/login" className="text-sm text-accent underline">{tr("← Back")}</Link>
      <h1 className="text-2xl font-semibold">{tr("Terms")}</h1>
      <p className="text-sm text-muted">{tr("Draft for the owner to review. It is not legal advice.")}</p>
      <ul className="list-disc space-y-2 ps-5 text-sm">
        {POINTS.map((p) => <li key={p}>{tr(p)}</li>)}
      </ul>
    </main>
  );
}
