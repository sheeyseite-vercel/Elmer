import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";

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
      <p className="text-xs text-muted">Audit log, data export and deletion controls are planned for Phase 2.</p>
    </div>
  );
}
