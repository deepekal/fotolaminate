"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const exhibitionImages = [
  "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos1.jpg",
  "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos2.jpg",
  "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos3.jpg",
  "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos4.jpg",
  "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos5.jpg",
];

export default function ExhibitionPhotosPage() {
  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max">
          <div className="max-w-3xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Gallery
            </span>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Exhibition Photos
            </h1>
            <p className="text-lg text-primary-foreground/75">
              Highlights from exhibitions and industry events.
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-muted">
          <div className="container-max">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {exhibitionImages.map((src, idx) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-lg border border-border bg-card shadow-industrial"
                >
                  <img
                    src={src}
                    alt={`Exhibition photo ${idx + 1}`}
                    className="h-64 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
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
