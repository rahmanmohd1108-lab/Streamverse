import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME, APP_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Stream Movies & Series`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "StreamVerse is an OTT streaming platform for movies and series. Watch premium content across multiple languages with adaptive streaming, profiles, watchlist, and personalized recommendations.",
  keywords: [
    "streaming",
    "movies",
    "series",
    "OTT",
    "watch online",
    "StreamVerse",
  ],
  authors: [{ name: APP_NAME }],
  openGraph: {
    title: `${APP_NAME} — Stream Movies & Series`,
    description:
      "Stream premium movies and series across multiple languages. Adaptive streaming, multiple profiles, personalized recommendations.",
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: "Stream premium movies and series on StreamVerse.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppProviders>{children}</AppProviders>
        <Toaster />
        <Sonner position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
