"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";
import WhyChooseUs from "@/components/WhyChooseUs";
import Manufacturing from "@/components/Manufacturing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import QualityAssuranceDetails from "@/components/QualityAssuranceDetails";
import GrowingCompany from "@/components/GrowingCompany";
import QualityClients from "@/components/QualityClients";
import { CheckCircle2, ClipboardCheck, Wrench, ShieldCheck } from "lucide-react";
import Link from "next/link";

const AboutPage = () => (
  <>
    <Navbar />

    <header className="gradient-navy pt-28 pb-16">
      <div className="container-max px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            About Foto Laminate
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Built for precision, reliability, and consistent output
          </h1>
          <p className="text-lg text-primary-foreground/75">
            We design and manufacture photo lamination machines that are engineered for daily production environments.
            From component selection to final testing, we focus on stable performance and predictable service.
          </p>
        </div>
      </div>
    </header>

    <main>
      <About />
      <QualityAssuranceDetails />

      <section className="section-padding bg-muted">
        <div className="container-max">
          <div className="mb-10 text-center">
            <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
              Our Standards
            </span>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">What you can expect</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ClipboardCheck,
                title: "Quality Checks",
                desc: "Every machine is inspected for alignment, heating stability, and smooth feeding before dispatch.",
              },
              {
                icon: ShieldCheck,
                title: "Industrial Build",
                desc: "Designed for long running hours with durable parts and service-friendly assemblies.",
              },
              {
                icon: Wrench,
                title: "After-Sales Support",
                desc: "Clear support process for troubleshooting, spares, and service scheduling.",
              },
              {
                icon: CheckCircle2,
                title: "Consistent Output",
                desc: "Stable lamination performance for professional finish across different films and media.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-6 shadow-industrial">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-border bg-card p-6 shadow-industrial md:p-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="mb-3 font-display text-2xl font-bold text-foreground">Why teams choose us</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  Customers typically evaluate us on two outcomes: output quality and uptime. We focus on predictable
                  machine behavior, clear operating guidance, and service that keeps production moving.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Precision roller alignment and stable feeding",
                    "Heating stability designed for consistent adhesion",
                    "Clear guidance on film, settings, and operation",
                    "Service-friendly design with accessible components",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-md bg-muted p-3">
                      <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg gradient-navy p-6 text-primary-foreground">
                <h4 className="mb-2 font-display text-lg font-bold">Need help selecting a model?</h4>
                <p className="mb-5 text-sm text-primary-foreground/70">
                  Share your media size, film type, and daily volume. We will recommend a suitable machine category.
                </p>
                <Link
                  href="/contact"
                  className="inline-block rounded-md gradient-accent px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Request a consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhyChooseUs />
      <Manufacturing />
      <GrowingCompany />
      <QualityClients />
      <Testimonials />
      <FAQ />

      <section className="section-padding bg-card">
        <div className="container-max">
          <div className="rounded-lg border border-border bg-muted p-8 shadow-industrial md:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-3 font-display text-3xl font-bold text-foreground">Talk to our team</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  For pricing, specifications, or a service request, send an inquiry and we will respond with the
                  details you need.
                </p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Link
                  href="/contact"
                  className="rounded-md gradient-navy px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </>
);

export default AboutPage;
