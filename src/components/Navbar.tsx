"use client";

import { useState, useEffect } from "react";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

const PHONE_PRIMARY = { display: "+91 98736 84816", tel: "+919873684816" };
const PHONE_SECONDARY = { display: "+91 98731 84816", tel: "+919873184816" };

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

const desktopLinkClass = (active: boolean) =>
  `relative rounded-md px-2.5 py-2 text-sm font-medium xl:px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
    active ? "text-primary-foreground" : "text-primary-foreground/75 hover:text-primary-foreground"
  }`;

/** Orange bar under the current page's link. */
const ActiveBar = ({ show }: { show: boolean }) =>
  show ? <span className="absolute inset-x-2.5 -bottom-0.5 xl:inset-x-3 h-0.5 rounded-full bg-accent" aria-hidden="true" /> : null;

const Navbar = () => {
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const galleryActive = galleryLinks.some((g) => isActive(pathname, g.to));
  const solid = scrolled || mobileOpen;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        // Inset hairline instead of a border so it adds no height.
        solid ? "bg-primary/95 shadow-[inset_0_-1px_0_hsl(0_0%_100%/0.1),0_10px_15px_-3px_rgb(0_0_0/0.25)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      {/* Single row. Fixed min-height keeps header height (and the Products sticky-filter offsets) stable. */}
      <div className="container-max flex min-h-16 items-center justify-between gap-4 lg:min-h-[76px] xl:gap-6">
        <Link href="/" aria-label="Photo Laminate — home" className="shrink-0">
          <img
            src="/logo-360.webp"
            srcSet="/logo-360.webp 1x, /logo-720.webp 2x"
            alt="Photo Laminate"
            width={236}
            height={36}
            className="h-8 w-auto sm:h-9 lg:h-7 xl:h-10"
          />
        </Link>

        <div className="hidden items-center lg:flex xl:gap-2">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.to);
            return (
              <Link key={link.to} href={link.to} aria-current={active ? "page" : undefined} className={desktopLinkClass(active)}>
                {link.label}
                <ActiveBar show={active} />
              </Link>
            );
          })}

          <div className="group relative">
            <button type="button" aria-haspopup="menu" className={`${desktopLinkClass(galleryActive)} inline-flex items-center gap-1`}>
              Gallery
              <ChevronDown size={14} className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden="true" />
              <ActiveBar show={galleryActive} />
            </button>
            <div
              className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
              role="menu"
            >
              <div className="flex min-w-52 flex-col rounded-lg border border-primary-foreground/10 bg-primary p-1.5 shadow-xl">
                {galleryLinks.map((item) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    role="menuitem"
                    className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10 focus-visible:outline-none ${
                      isActive(pathname, item.to) ? "text-accent" : "text-primary-foreground/80 hover:text-primary-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${PHONE_PRIMARY.tel}`}
            aria-label={`Call ${PHONE_PRIMARY.display}`}
            className="flex items-center gap-2 rounded-full gradient-accent p-2.5 text-sm font-semibold text-accent-foreground shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground lg:py-2 lg:pl-2 lg:pr-4"
          >
            <span className="flex h-5 w-5 items-center justify-center lg:h-7 lg:w-7 lg:rounded-full lg:bg-white/20">
              <Phone size={15} aria-hidden="true" />
            </span>
            <span className="hidden whitespace-nowrap lg:inline xl:hidden">Call now</span>
            <span className="hidden whitespace-nowrap xl:inline">{PHONE_PRIMARY.display}</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-primary-foreground/10 bg-primary lg:hidden"
          >
            <div className="container-max flex flex-col gap-1 py-4">
              {[...navLinks, ...galleryLinks].map((link) => {
                const active = isActive(pathname, link.to);
                return (
                  <Link
                    key={link.to}
                    href={link.to}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2.5 text-base transition-colors ${
                      active
                        ? "bg-primary-foreground/10 font-semibold text-primary-foreground"
                        : "text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-3 space-y-2 border-t border-primary-foreground/10 px-3 pt-4 text-sm text-primary-foreground/80">
                {[PHONE_PRIMARY, PHONE_SECONDARY].map((p) => (
                  <a key={p.tel} href={`tel:${p.tel}`} className="flex items-center gap-3 py-1 hover:text-accent">
                    <Phone size={16} className="text-accent" aria-hidden="true" />
                    {p.display}
                  </a>
                ))}
                <a href="mailto:codalam@yahoo.co.in" className="flex items-center gap-3 py-1 hover:text-accent">
                  <Mail size={16} className="text-accent" aria-hidden="true" />
                  codalam@yahoo.co.in
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
