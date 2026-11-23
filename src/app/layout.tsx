import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: { default: "ALSMUN V", template: "%s · ALSMUN V" },
  description: "ALSMUN V Model United Nations conference portal: amendments, resolutions, schedule and chair reports.",
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#0b1f3d", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader
          name={settings.conferenceName}
          user={user ? { name: user.name, role: user.role } : null}
        />
        <main id="main" className="flex-1">{children}</main>
        <SiteFooter name={settings.conferenceName} />
      </body>
    </html>
  );
}
