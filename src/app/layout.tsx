import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mi Salud",
  description: "Personal health management",
  appleWebApp: {
    capable: true,
    title: "Mi Salud",
    statusBarStyle: "default",
  },
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0066ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans"><Providers>{children}</Providers></body>
    </html>
  );
}
