import "../index.css";

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Script from "next/script";
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
        height: 456,
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
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon-32.png"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

import { Rajdhani, Open_Sans } from "next/font/google";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({'gtm.start': new Date().getTime(), event:'gtm.js'});
          `}
        </Script>
        <Script
          id="gtm-script"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-KNCTP7TN"
          strategy="lazyOnload"
        />

        {/* Google Ads & Analytics Tag (gtag.js) */}
        <Script
          id="gtag-script"
          src="https://www.googletagmanager.com/gtag/js?id=AW-17914852419"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17914852419');
            gtag('config', 'G-801HN559VK');
          `}
        </Script>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
