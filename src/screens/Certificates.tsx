"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { SyntheticEvent } from "react";

type ImageCandidate = {
  src: string;
  fallbackSrc?: string;
  title?: string;
};

const certificateImages: ImageCandidate[] = [
  { src: "/assets/Assets/Certificate/Certificate1.png", title: "Indiamart Trust Seal Certificate" },
  { src: "/assets/Assets/Certificate/Certificat2.png", title: "GST Certificate 1" },
  { src: "/assets/Assets/Certificate/Certificate3.png", title: "GST Certificate 2" },
  { src: "/assets/Assets/Certificate/Certificate4.png", title: "GST Certificate 3" },
  { src: "/assets/Assets/Certificate/Certificate5.png", title: "Udyog Aadhaar Registration Certificate" },
  { src: "/assets/Assets/Certificate/Certificate6.png", title: "UDYAM Registration Certificate" },
  { src: "/assets/Assets/Certificate/Certificate7.png", title: "India 5000 Best MSME Award 2019" },
  { src: "/assets/Assets/Certificate/CertificateNew1.jpg", title: "Registration Certificate" },
];

function handleImgError(e: SyntheticEvent<HTMLImageElement>, fallbackSrc?: string) {
  const img = e.currentTarget;

  if (fallbackSrc && img.dataset.triedFallback !== "1") {
    img.dataset.triedFallback = "1";
    img.src = fallbackSrc;
    return;
  }

  img.src = "/placeholder.svg";
}

export default function CertificatesPage() {
  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max px-4 md:px-8 lg:px-16">
          <div className="max-w-3xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Certificates
            </span>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Certificates
            </h1>
            <p className="text-lg text-primary-foreground/75">
              Company certificates and registrations.
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-muted">
          <div className="container-max">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {certificateImages.map((src, idx) => (
                <div
                  key={src.src}
                  className="overflow-hidden rounded-lg border border-border bg-card shadow-industrial"
                >
                  <img
                    src={src.src}
                    alt={src.title || `Certificate ${idx + 1}`}
                    className="h-auto w-full object-contain"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImgError(e, src.fallbackSrc)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
