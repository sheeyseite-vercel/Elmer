import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { deleteDemo, startDemo } from "./demo/actions";

export const metadata = { title: "Settings" };

const items = [
  { href: "/onboarding", title: "Business details", text: "Name, city, address, language, website and booking link." },
  { href: "/settings/ai-providers", title: "AI providers", text: "Gemini, Groq, OpenRouter or a custom provider, and which one is active." },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block rounded-card focus-visible:outline-2">
            <Card className="h-full transition hover:bg-surface-2">
              <CardTitle>{i.title}</CardTitle>
              <p className="mt-1 text-sm text-muted">{i.text}</p>
            </Card>
          </Link>
        ))}
      </div>
      <Card className="space-y-3">
        <CardTitle>Demo mode</CardTitle>
        <p className="text-sm text-muted">
          Explore every page with INVENTED data in a separate, clearly marked business. Your real data is not touched or
          mixed in, and a banner shows on every page while demo mode is on. Starting it again resets the demo data.
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={startDemo}><Button type="submit">Start demo</Button></form>
          <form action={deleteDemo}><Button type="submit" variant="ghost">Delete demo data</Button></form>
        </div>
      </Card>
      <p className="text-xs text-muted">Audit log, data export and deletion controls are planned for Phase 2.</p>
    </div>
  );
}
