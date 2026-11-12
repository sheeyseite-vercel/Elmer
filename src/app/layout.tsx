import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/pwa/register-sw";
import { DIR } from "@/lib/i18n/dict";
import { I18nProvider } from "@/lib/i18n/client";
import { getT } from "@/lib/i18n/server";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], variable: "--font-display-latin", display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: { default: "ELMER Business Intelligence", template: "%s · ELMER BI" },
  description: "Local visibility and marketing analytics for Elmer Osteopatia.",
  applicationName: "ELMER BI",
  appleWebApp: { capable: true, title: "ELMER BI", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a141c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getT();
  const theme = (await cookies()).get("elmer_theme")?.value;
  return (
    <html
      lang={locale}
      dir={DIR[locale]}
      data-theme={theme === "light" || theme === "dark" ? theme : undefined}
      className={`${inter.variable} ${arabic.variable} ${display.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
        >
          {t("app.skip")}
        </a>
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
