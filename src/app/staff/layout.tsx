import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "../globals.css";
import { StaffPwa } from "./app-client";
import { deviceStaffLang } from "@/lib/staff-auth";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: { default: "Clinex Staff", template: "%s | Clinex Staff" },
  robots: { index: false, follow: false },
  // Its own install manifest, so it installs as "Clinex Staff", not the customer site.
  manifest: "/staff/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Clinex Staff", statusBarStyle: "black-translucent" },
  icons: { icon: [{ url: "/icons/staff/192", type: "image/png" }], apple: "/icons/staff/180" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#031432",
  width: "device-width",
  initialScale: 1,
  // Edge to edge on notched phones; padding uses the safe-area insets.
  viewportFit: "cover",
};

// Cleaners' phone app: its own root layout, separate from the website and admin.
export default async function StaffRootLayout({ children }: LayoutProps<"/staff">) {
  return (
    <html lang={await deviceStaffLang()} className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full bg-navy font-sans text-ink">
        <StaffPwa />
        {children}
      </body>
    </html>
  );
}
