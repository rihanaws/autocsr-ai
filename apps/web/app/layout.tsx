import type { Metadata } from "next";
import "./globals.css";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const syne = Syne({ subsets: ["latin"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "AutoCSR — AI Customer Service Automation",
  description: "AI-native CSR automation for online betting platforms",
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
      className={cn(syne.variable, dmSans.variable, jetbrainsMono.variable)}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}
