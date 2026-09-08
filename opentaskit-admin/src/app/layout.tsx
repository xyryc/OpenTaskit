import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenTaskit Admin Portal",
  description: "Management, KYC verification, dispute resolution, and escrow oversight for OpenTaskit.",
  icons: {
    icon: [
      { url: "/brand/icon-brand.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/brand/icon-brand.png",
    apple: "/brand/icon-brand.png",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/brand/icon-brand.png" type="image/png" />
        <link rel="apple-touch-icon" href="/brand/icon-brand.png" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-background text-foreground"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="opentaskit-admin-theme"
          enableSystem={false}
          enableColorScheme={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
