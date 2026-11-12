import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Offline" };

export default async function OfflinePage() {
  const { tr } = await getT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">{tr("You are offline")}</h1>
      <p className="text-muted">
        {tr("ELMER BI needs an internet connection to load your analytics, imports and reports. For your privacy, business data is never stored for offline use. Reconnect and try again.")}
      </p>
    </main>
  );
}
