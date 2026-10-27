import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "../globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: { default: "Invoice", template: "%s | Clinex Pro" },
  // Private links: never indexed, and no referrer leaks the token to other sites.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Customer invoice links (/i/<token>): a plain printable page outside the website's language routes.
export default function InvoiceRootLayout({ children }: LayoutProps<"/i">) {
  return (
    <html lang="en" className={`${roboto.variable} antialiased`}>
      <body className="bg-surface-alt font-sans print:bg-white">{children}</body>
    </html>
  );
}
