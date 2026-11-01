"use client";

import Link from "next/link";
import { Download, BookOpen } from "lucide-react";

type CatalogueSectionProps = {
  heading?: string;
  body?: string;
};

const CatalogueSection = ({
  heading = "Download Our Full Product Catalogue",
  body =
    "Browse our complete range of photo lamination machines, album making machines, UV coating machines, and accessories. The catalogue includes specifications, dimensions, and ordering information.",
}: CatalogueSectionProps) => {
  const catalogueUrl = process.env.NEXT_PUBLIC_CATALOGUE_URL ?? "";

  return (
    <section className="section-padding bg-card">
      <div className="container-max">
        <div className="rounded-xl border border-border bg-muted p-8 shadow-industrial md:p-12">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:gap-12">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full gradient-accent">
              <BookOpen size={36} className="text-accent-foreground" />
            </div>
            <div className="flex-1">
              <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
                Product Catalogue
              </span>
              <h2 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">
                {heading}
              </h2>
              <p className="text-muted-foreground">{body}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              {catalogueUrl ? (
                <a
                  href="/FotolaminateCatalogue.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md gradient-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                >
                  <Download size={16} />
                  Download PDF
                </a>
              ) : null}
              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                View Catalogue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CatalogueSection;
