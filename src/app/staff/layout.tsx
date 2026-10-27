import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "../globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: { default: "Clinex Pro Staff", template: "%s | Clinex Pro Staff" },
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Clinex Staff", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#031432" };

// Cleaners' phone app: its own root layout, separate from the website and admin.
export default function StaffRootLayout({ children }: LayoutProps<"/staff">) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full bg-surface-alt font-sans">{children}</body>
    </html>
  );
}
