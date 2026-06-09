import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";

// Inter — body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// GeistSans exposes --font-geist-sans; we alias it to --font-display in globals.css

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autocsr.ai";
const OG_IMAGE = `${APP_URL}/opengraph-image`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "AutoCSR — AI Customer Service Automation for iGaming",
    template: "%s | AutoCSR",
  },
  description:
    "AutoCSR resolves 61% of betting platform CSR queries instantly with AI. " +
    "5 specialized agents, semantic cache, continuous learning. Deploy in 30 days.",
  keywords: [
    "AI customer service automation",
    "iGaming CSR",
    "betting platform AI",
    "online casino customer support",
    "LLM CSR automation",
    "sports betting customer service",
    "AI helpdesk",
  ],
  authors: [{ name: "TechSci, Inc.", url: APP_URL }],
  creator: "TechSci, Inc.",
  publisher: "TechSci, Inc.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "AutoCSR",
    title: "AutoCSR — AI Customer Service for iGaming Operators",
    description:
      "Cut your betting platform's CSR cost by 61%. 5 specialized AI agents trained on your exact platform. Deployed in 30 days.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "AutoCSR — AI CSR Automation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoCSR — AI Customer Service for iGaming Operators",
    description:
      "Cut your betting platform's CSR cost by 61%. 5 specialized AI agents. Deployed in 30 days.",
    images: [OG_IMAGE],
    creator: "@techsci_inc",
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(GeistSans.variable, inter.variable, jetbrainsMono.variable)}
    >
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
