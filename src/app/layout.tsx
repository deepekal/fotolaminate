import "../index.css";

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Analytics from "@/components/Analytics";
import Providers from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fotolaminate.com"),
  title: {
    default: "Foto Laminate Precision",
    template: "%s",
  },
  description:
    "Foto Laminate Precision manufactures industrial photo lamination machines and finishing solutions.",
  keywords: [
    "Foto Laminate Precision",
    "photo lamination machine",
    "industrial laminator",
    "photo laminate",
    "lamination",
    "finishing machines",
  ],
  applicationName: "Foto Laminate Precision",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Foto Laminate Precision",
    url: "/",
    title: "Foto Laminate Precision",
    description:
      "Industrial photo lamination machines and finishing solutions by Foto Laminate Precision.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Foto Laminate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Foto Laminate Precision",
    description:
      "Industrial photo lamination machines and finishing solutions by Foto Laminate Precision.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

import { Rajdhani, Open_Sans } from "next/font/google";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  // Only headings/labels use Rajdhani, all at semibold or bold.
  weight: ["600", "700"],
  variable: "--font-display",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${openSans.variable}`}>
      <head>
        <meta name="google-site-verification" content="verification_placeholder" />
      </head>
      <body suppressHydrationWarning>

        <Analytics />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
