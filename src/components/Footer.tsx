"use client";

import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

const Footer = () => (
  <footer className="gradient-navy section-padding pb-8">
    <div className="container-max">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" aria-label="Foto Laminate — home" className="mb-4 inline-block">
            <img
              src="/logo-360.webp"
              srcSet="/logo-360.webp 1x, /logo-720.webp 2x"
              alt="Foto Laminate"
              width={215}
              height={72}
              className="h-[72px] w-auto drop-shadow-[0_0_1px_rgba(255,255,255,0.95)]"
              loading="lazy"
            />
          </Link>
          <p className="text-sm text-primary-foreground/60">
            Leading manufacturer of photo lamination machines at an affordable price in Delhi, India.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-accent">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                About
              </Link>
            </li>
            <li>
              <Link href="/awards" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Awards
              </Link>
            </li>
            <li>
              <Link href="/certificates" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Certificates
              </Link>
            </li>
            <li>
              <Link
                href="/exhibition-photos"
                className="text-sm text-primary-foreground/60 transition-colors hover:text-accent"
              >
                Exhibition Photos
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Products
              </Link>
            </li>
            <li>
              <Link href="/videos" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Videos
              </Link>
            </li>
            <li>
              <Link href="/catalogue" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Catalogue
              </Link>
            </li>
            <li>
              <Link href="/blogs" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Blogs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy-disclaimer" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                Privacy & Disclaimer
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-accent">Products</h3>
          <ul className="space-y-2">
            {["Photo Lamination Machines", "Roll Lamination Machines", "Hot Lamination Machines", "Cold Lamination Machines", "Industrial Laminators"].map((p) => (
              <li key={p}>
                <Link href="/products" className="text-sm text-primary-foreground/60 transition-colors hover:text-accent">
                  {p}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-accent">Contact</h3>
          <ul className="space-y-3">
            <li className="flex flex-col gap-1 text-sm text-primary-foreground/60">
              <h6 className="text-accent font-semibold">Factory Address</h6>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-accent mt-0.5 shrink-0" /> G.FLOOR, HO.IN.KH.NO.-87/570/II-4, MAIDAN GARHI, New Delhi,  <br /> Delhi - 110030.
              </div>
            </li>
            <li className="flex flex-col gap-1 text-sm text-primary-foreground/60">
              <h6 className="text-accent font-semibold">Corporate Office Address</h6>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-accent mt-0.5 shrink-0" /> Shop No. 3, Suman Market, 1st Floor, Esplanade Road, Chandni Chowk,<br /> Delhi - 110006.
              </div>
            </li>
            <li className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <Phone size={14} className="text-accent" /> +91 9873684816 / +91 9873184816
            </li>
            <li className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <Mail size={14} className="text-accent" /> codalam@yahoo.co.in
            </li>

            <li className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <span className="text-accent font-semibold">GST:</span> 07ACJPV6163A1ZJ
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 border-t border-primary-foreground/10 pt-6 flex flex-col items-center gap-2 text-center text-xs text-primary-foreground/40">
        <div>© {new Date().getFullYear()} Foto Laminate. All rights reserved. Delhi, India.</div>
        <Link href="/dashboard" className="text-primary-foreground/25 hover:text-primary-foreground/60 transition-colors">Admin</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
