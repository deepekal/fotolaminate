"use client";

import { Phone, Mail, MapPin, Facebook, Youtube, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";
import { slugifyCategory } from "@/lib/slug";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "About us", href: "/about" },
  { label: "All products", href: "/products" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Videos", href: "/videos" },
  { label: "Blog", href: "/blogs" },
  { label: "Awards", href: "/awards" },
  { label: "Certificates", href: "/certificates" },
  { label: "Exhibition photos", href: "/exhibition-photos" },
  { label: "Contact us", href: "/contact" },
];

// Real product categories (must match the product "Category" values in the CMS).
const productCategories = [
  "Cold Lamination Machine",
  "Thermal Lamination Machine",
  "UV Coating Machine",
  "Karizma Photo Album Machine",
  "Cutting Machine",
  "Photo Frame Cutting Machine",
  "Machine Accessories & Raw Materials",
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/fotolaminate/", icon: Facebook },
  { label: "YouTube", href: "https://www.youtube.com/@fotolaminate5864", icon: Youtube },
  { label: "Instagram", href: "https://www.instagram.com/fotolaminate", icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/fotolaminate/", icon: Linkedin },
  { label: "X (Twitter)", href: "https://x.com/fotolaminate", icon: Twitter },
];

const linkClass =
  "text-sm text-primary-foreground/65 transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none";

const FooterHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-4 font-display text-lg font-bold text-primary-foreground">{children}</h3>
);

const Footer = () => (
  <footer className="bg-[hsl(213_62%_13%)] text-primary-foreground">
    {/* Thin brand rule across the top edge */}
    <div className="h-1 gradient-accent" aria-hidden="true" />

    <div className="container-max py-14 md:py-16">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-3">
          <Link href="/" aria-label="Foto Laminate — home" className="inline-block">
            <img
              src="/logo-360.webp"
              srcSet="/logo-360.webp 1x, /logo-720.webp 2x"
              alt="Photo Laminate"
              width={260}
              height={40}
              className="h-auto w-full max-w-[260px]"
              loading="lazy"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/65">
            Photo lamination, coating, cutting and album-making machines, built at our factory in Maidan Garhi,
            New Delhi, and delivered across India.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Foto Laminate on social media">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/15 text-primary-foreground/75 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:border-accent focus-visible:outline-none"
                >
                  <Icon size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3">
          <FooterHeading>Explore</FooterHeading>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {exploreLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <FooterHeading>Machines</FooterHeading>
          <ul className="space-y-2.5">
            {productCategories.map((c) => (
              <li key={c}>
                <Link href={`/products/category/${slugifyCategory(c)}`} className={linkClass}>
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <address className="not-italic lg:col-span-3">
          <FooterHeading>Get in touch</FooterHeading>
          <ul className="space-y-4 text-sm text-primary-foreground/65">
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-primary-foreground">Factory</span>
                Ground Floor, House No. 87/570/II4, Maidan Garhi, New Delhi - 110030
              </span>
            </li>
            <li className="flex gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-primary-foreground">Corporate office</span>
                Shop No. 3, Suman Market, 1st Floor, Esplanade Road, Chandni Chowk, Delhi - 110006
              </span>
            </li>
            <li className="flex gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <span className="flex flex-col">
                <a href="tel:+919873684816" className={linkClass}>
                  +91 98736 84816
                </a>
                <a href="tel:+919873184816" className={linkClass}>
                  +91 98731 84816
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              <a href="mailto:codalam@yahoo.co.in" className={linkClass}>
                codalam@yahoo.co.in
              </a>
            </li>
          </ul>
        </address>
      </div>
    </div>

    <div className="border-t border-primary-foreground/10 bg-black/20">
      <div className="container-max flex flex-col gap-3 py-5 text-xs text-primary-foreground/55 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} Foto Laminate. All rights reserved.
          <span className="ml-3 whitespace-nowrap">GST: 07ACJPV6163A1ZJ</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:pr-16">
          <Link href="/privacy-disclaimer" className="transition-colors hover:text-accent">
            Privacy &amp; disclaimer
          </Link>
          <Link href="/dashboard" className="text-primary-foreground/30 transition-colors hover:text-primary-foreground/70">
            Admin
          </Link>
          <span>
            Designed and developed by{" "}
            <a
              href="https://www.daitpartners.com"
              target="_blank"
              rel="noopener"
              className="font-semibold text-primary-foreground/80 underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              DAIT Partners
            </a>
          </span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
