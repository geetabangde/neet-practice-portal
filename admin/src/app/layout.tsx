import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NEET PG Admin",
    template: "%s | NEET PG Admin",
  },
  description: "Admin console for the NEET PG practice platform (demo data).",
  // An admin console should never show up in search engines
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions can add attributes to <body> before React loads */}
      <body className="min-h-full" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
