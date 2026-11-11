"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone, Facebook, Youtube, Instagram, Linkedin, Twitter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Products", to: "/products" },
  { label: "Catalogue", to: "/catalogue" },
  { label: "Videos", to: "/videos" },
  { label: "Blog", to: "/blogs" },
  { label: "Contact Us", to: "/contact" },
];

const galleryLinks = [
  { label: "Exhibition Photos", to: "/exhibition-photos" },
  { label: "Awards", to: "/awards" },
  { label: "Certificates", to: "/certificates" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-primary/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="hidden w-full border-b border-primary-foreground/10 bg-primary/80 py-1 text-xs text-primary-foreground/80 backdrop-blur-sm lg:block">
        <div className="container-max flex items-center justify-between">
          <div>
            GST No: 07ACJPV6163A1ZJ &nbsp;|&nbsp;
            <a href="mailto:codalam@yahoo.co.in" className="hover:text-accent">codalam@yahoo.co.in</a>
          </div>
          {/* -my-0.5 keeps the pill from making the top bar taller (sticky offsets depend on header height). */}
          <div className="-my-0.5 flex items-center gap-2 rounded-full gradient-accent px-3 py-0.5 font-semibold text-accent-foreground">
            <Phone size={12} aria-hidden="true" />
            <a href="tel:+919873684816" className="hover:underline">+91 98736 84816</a>
            <span aria-hidden="true">/</span>
            <a href="tel:+919873184816" className="hover:underline">+91 98731 84816</a>
          </div>
        </div>
      </div>
      <div className="container-max flex items-center justify-between py-2">
        <Link href="/" aria-label="Foto Laminate — home" className="shrink-0">
          <img
            src="/logo-360.webp"
            srcSet="/logo-360.webp 1x, /logo-720.webp 2x"
            alt="Foto Laminate"
            width={143}
            height={48}
            className="h-11 w-auto drop-shadow-[0_0_1px_rgba(255,255,255,0.95)] sm:h-12"
          />
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}

          <div className="group relative">
            <button
              type="button"
              className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-accent"
              aria-haspopup="menu"
            >
              Gallery
            </button>
            <div
              className="invisible absolute left-0 top-full z-50 mt-3 min-w-56 overflow-hidden rounded-md border border-primary-foreground/10 bg-primary/95 opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:visible group-hover:opacity-100"
              role="menu"
            >
              <div className="flex flex-col p-2">
                {galleryLinks.map((item) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    className="rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-accent"
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <a
            href="tel:+919873684816"
            className="gradient-accent flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
          >
            <Phone size={14} />
            Call Now
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-primary-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-primary lg:hidden"
          >
            <div className="flex flex-col gap-2 px-4 pb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-navy-light hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                  Gallery
                </div>
                <div className="flex flex-col gap-1">
                  {galleryLinks.map((item) => (
                    <Link
                      key={item.to}
                      href={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm text-primary-foreground/80 transition-colors hover:bg-navy-light hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-6 px-3 py-2">
                <a href="https://www.facebook.com/fotolaminate/" target="_blank" rel="noreferrer" className="text-primary-foreground/60 transition-colors hover:text-accent">
                  <Facebook size={20} />
                </a>
                <a href="https://www.youtube.com/@fotolaminate5864" target="_blank" rel="noreferrer" className="text-primary-foreground/60 transition-colors hover:text-accent">
                  <Youtube size={20} />
                </a>
                <a href="https://www.instagram.com/fotolaminate" target="_blank" rel="noreferrer" className="text-primary-foreground/60 transition-colors hover:text-accent">
                  <Instagram size={20} />
                </a>
                <a href="https://www.linkedin.com/company/fotolaminate/" target="_blank" rel="noreferrer" className="text-primary-foreground/60 transition-colors hover:text-accent">
                  <Linkedin size={20} />
                </a>
                <a href="https://x.com/fotolaminate" target="_blank" rel="noreferrer" className="text-primary-foreground/60 transition-colors hover:text-accent">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
