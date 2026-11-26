import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const cooperFallback = Fraunces({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-cooper-fallback",
});

export const metadata: Metadata = {
  title: "SSF Champad Sector — Students' Council",
  description: "Delegate Check-in & Council Analytics Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${cooperFallback.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200`}
      >
        {children}
      </body>
    </html>
  );
}