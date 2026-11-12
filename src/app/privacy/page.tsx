import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Privacy" };

const POINTS = [
  "What is stored: the business details you enter, the figures you import or type (counts per day or period), your own rank checks, public competitor information you enter, review records you type, and your sign-in email.",
  "What is not stored: patient or health information, appointment details, reviewer names, or anything read from Google without your action. The app does not scrape Google.",
  "Where it lives: your data is kept in Firebase (Google Cloud, EU region) and the app runs on Vercel. Only the owner accounts on the allow-list can sign in.",
  "AI analysis: if you run it, a summary of your recorded figures is sent to the AI provider you configured. Review text and notes are never sent. Your provider key is encrypted on the server.",
  "Cookies: a sign-in session cookie, plus language and theme preferences. No advertising or tracking cookies.",
  "Your control: you can delete any entry, report or month of data in the app. To remove the whole account, ask the owner of the deployment.",
];

export default async function PrivacyPage() {
  const { tr } = await getT();
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <Link href="/login" className="text-sm text-accent underline">{tr("← Back")}</Link>
      <h1 className="text-2xl font-semibold">{tr("Privacy")}</h1>
      <p className="text-sm text-muted">{tr("Draft for the owner to review. It is not legal advice.")}</p>
      <ul className="list-disc space-y-2 ps-5 text-sm">
        {POINTS.map((p) => <li key={p}>{tr(p)}</li>)}
      </ul>
    </main>
  );
}
