"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, Phone, ChevronLeft, ChevronRight, Facebook, Youtube, Instagram, Linkedin, Twitter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api, type ProductRecord } from "@/lib/api";
import { slugifyCategory } from "@/lib/slug";

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

const MEGA_MENU_PRODUCT_LIMIT = 2;

function groupProductsByCategory(products: ProductRecord[]) {
  const map = new Map<string, ProductRecord[]>();
  for (const p of products) {
    if (!p.published) continue;
    const key = (p.category ?? "").trim() || "Other";
    const list = map.get(key);
    if (list) list.push(p);
    else map.set(key, [p]);
  }

  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  for (const [, list] of entries) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return entries;
}

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsByCategory, setProductsByCategory] = useState<Array<[string, ProductRecord[]]>>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const megaMenuScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const list = await api.products.list();
        if (active) setProductsByCategory(groupProductsByCategory(list));
      } catch {
        if (active) setProductsByCategory([]);
      } finally {
        if (active) setProductsLoaded(true);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const scrollMegaMenu = (direction: "left" | "right") => {
    const el = megaMenuScrollRef.current;
    if (!el) return;
    const delta = Math.max(240, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-primary/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="hidden w-full border-b border-primary-foreground/10 bg-primary/80 px-4 py-1 text-xs text-primary-foreground/80 backdrop-blur-sm lg:block">
        <div className="container-max flex items-center justify-between">
          <div>
            GST No: 07ACJPV6163A1ZJ &nbsp;|&nbsp;
            <a href="tel:+919873684816" className="hover:text-accent">+91 9873684816</a> /
            <a href="tel:+919873184816" className="hover:text-accent"> +91 9873184816</a> &nbsp;|&nbsp;
            <a href="mailto:codalam@yahoo.co.in" className="hover:text-accent">codalam@yahoo.co.in</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/fotolaminate/" target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
              <Facebook size={14} />
            </a>
            <a href="https://www.youtube.com/@fotolaminate5864" target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
              <Youtube size={14} />
            </a>
            <a href="https://www.instagram.com/fotolaminate" target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
              <Instagram size={14} />
            </a>
            <a href="https://www.linkedin.com/company/fotolaminate/" target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
              <Linkedin size={14} />
            </a>
            <a href="https://x.com/fotolaminate" target="_blank" rel="noreferrer" className="transition-colors hover:text-accent">
              <Twitter size={14} />
            </a>
          </div>
        </div>
      </div>
      <div className="container-max flex items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="font-display text-xl sm:text-2xl font-bold tracking-tight text-primary-foreground truncate max-w-[70%]">
          FOTO <span className="text-accent">LAMINATE</span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            if (link.to !== "/products") {
              return (
                <Link
                  key={link.to}
                  href={link.to}
                  className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              );
            }

            return (
              <div key={link.to} className="group static">
                <Link
                  href={link.to}
                  className="text-sm font-medium text-primary-foreground/80 transition-colors hover:text-accent"
                  aria-haspopup="menu"
                >
                  {link.label}
                </Link>

                <div
                  className="invisible absolute left-0 right-0 top-full z-50 mt-0 h-[calc(100vh-80px)] overflow-hidden border-y border-primary-foreground/10 bg-primary/95 opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 group-hover:visible group-hover:opacity-100"
                  role="menu"
                >
                  <div className="container-max h-full px-4 py-8 md:px-8">
                    <div className="flex h-full flex-col">
                      <div className="mb-6 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                            Products
                          </div>
                          <div className="font-display text-2xl font-bold text-primary-foreground">Browse categories</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollMegaMenu("left")}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/10 bg-primary/60 text-primary-foreground/80 transition-colors hover:text-accent"
                              aria-label="Scroll categories left"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollMegaMenu("right")}
                              className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/10 bg-primary/60 text-primary-foreground/80 transition-colors hover:text-accent"
                              aria-label="Scroll categories right"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                          <Link
                            href="/products"
                            className="text-sm font-semibold text-accent transition-colors hover:text-primary-foreground"
                            role="menuitem"
                          >
                            View all →
                          </Link>
                        </div>
                      </div>

                      <div className="flex-1">
                        {!productsLoaded ? (
                          <div className="flex h-full items-center justify-center rounded-lg border border-primary-foreground/10 bg-primary/60 p-4 text-sm text-primary-foreground/70">
                            Loading…
                          </div>
                        ) : productsByCategory.length === 0 ? (
                          <div className="flex h-full items-center justify-center rounded-lg border border-primary-foreground/10 bg-primary/60 p-4 text-sm text-primary-foreground/70">
                            No products found.
                          </div>
                        ) : (
                          <div
                            ref={megaMenuScrollRef}
                            className="grid h-full grid-flow-col grid-rows-2 auto-cols-[260px] gap-3 overflow-x-auto overflow-y-hidden scroll-smooth"
                          >
                            {productsByCategory.map(([category, list]) => {
                              const categorySlug = slugifyCategory(category);
                              const categoryHref = `/products/category/${categorySlug}`;
                              const visibleProducts = list.slice(0, MEGA_MENU_PRODUCT_LIMIT);
                              const hasMore = list.length > visibleProducts.length;

                              return (
                                <section
                                  key={category}
                                  className="flex h-full flex-col rounded-lg border border-primary-foreground/10 bg-primary/60 p-4"
                                >
                                  <Link
                                    href={categoryHref}
                                    className="block font-display text-sm font-bold uppercase tracking-wider text-accent transition-colors hover:text-primary-foreground"
                                    role="menuitem"
                                  >
                                    {category}
                                  </Link>

                                  <div className="mt-3 flex flex-1 flex-col gap-2">
                                    {visibleProducts.map((p) => (
                                      <Link
                                        key={p.id}
                                        href={`/products/${p.slug}`}
                                        className="text-sm text-primary-foreground/80 transition-colors hover:text-accent"
                                        role="menuitem"
                                      >
                                        {p.name}
                                      </Link>
                                    ))}
                                  </div>

                                  {hasMore ? (
                                    <Link
                                      href={categoryHref}
                                      className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary-foreground/70 transition-colors hover:text-accent"
                                      role="menuitem"
                                    >
                                      View more →
                                    </Link>
                                  ) : null}
                                </section>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

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
