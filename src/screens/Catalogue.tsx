"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CataloguePage() {
  const catalogueUrl = process.env.NEXT_PUBLIC_CATALOGUE_URL ?? "";

  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max px-4 md:px-8 lg:px-16">
          <div className="max-w-3xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Catalogue
            </span>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Product catalogue
            </h1>
            <p className="text-lg text-primary-foreground/75">
              Download the latest catalogue. For the most accurate pricing and availability, contact us with your size
              and volume.
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-white">
          <div className="container-max">
            <div className="flex flex-col gap-16">
              <div className="flex flex-col gap-12">
                <div className="rounded-lg border border-border bg-white p-8 shadow-industrial">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-foreground">View & Download catalogue</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Browse our complete product range directly on this page, or download the PDF.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <a
                        href="/FotolaminateCatalogue.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md border-2 border-accent bg-transparent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent transition-colors hover:bg-accent/10"
                      >
                        View Full Screen
                      </a>
                      <a
                        href="/FotolaminateCatalogue.pdf"
                        download
                        className="inline-flex items-center justify-center rounded-md gradient-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
                  {/* A4 aspect ratio is approx 1:1.414 (width:height) */}
                  <div className="relative w-full" style={{ paddingBottom: '141.4%' }}>
                    <iframe
                      src="/FotolaminateCatalogue.pdf#toolbar=0&navpanes=0&scrollbar=0"
                      className="absolute left-0 top-0 h-full w-full border-none"
                      title="Product Catalogue Viewer"
                    />
                  </div>
                </div>
              </div>

              {/* We Are Growing Section */}
              <section className="grid items-center gap-12 lg:grid-cols-2">
                <div className="order-2 lg:order-1">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl">
                    <div className="aspect-video bg-white flex items-center justify-center p-4">
                      <img
                        src="/assets/Assets/Home/ExcellentlyEngineered.png"
                        alt="Growth and Excellence"
                        className="h-auto w-full object-contain rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
                    Growing With You
                  </span>
                  <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
                    We Are a Growing Manufacturing Company
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { title: "25+ Years Experience", desc: "Serving the Indian photo and printing industry since 1998." },
                      { title: "5,000+ Machines Sold", desc: "Trusted by thousands of businesses across the Indian subcontinent." },
                      { title: "100+ Corporate Houses", desc: "Partnering with major print houses for industrial-grade solutions." },
                      { title: "250+ Repeat Orders", desc: "Building long-term trust through quality and dedicated service." }
                    ].map((card) => (
                      <div key={card.title} className="rounded-lg border border-border bg-white p-4 shadow-sm hover:border-accent/30 transition-colors">
                        <h4 className="font-display font-bold text-foreground text-sm uppercase tracking-tight">{card.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
