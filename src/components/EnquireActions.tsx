"use client";

import { MessageCircle, Phone, Youtube, Instagram, Facebook, Linkedin, Twitter, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_PHONE = "919873684816";
const CALL_PHONE_E164 = "+919873684816";

const SOCIAL_LINKS = [
  {
    key: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@fotolaminate5864",
    icon: Youtube,
    color: "bg-red-600",
  },
  {
    key: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/fotolaminate",
    icon: Instagram,
    color: "bg-pink-600",
  },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/fotolaminate/",
    icon: Facebook,
    color: "bg-blue-600",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/fotolaminate/",
    icon: Linkedin,
    color: "bg-blue-700",
  },
  {
    key: "x",
    label: "X (Twitter)",
    href: "https://x.com/fotolaminate",
    icon: Twitter,
    color: "bg-black",
  },
];

function buildWhatsAppText(pathname: string, productName?: string) {
  if (pathname.startsWith("/products/") && !pathname.startsWith("/products/category/")) {
    if (productName?.trim()) {
      return `Hi! I am here to enquire about ${productName.trim()}. Please share price, specifications, availability, and delivery time.`;
    }
    return "Hi! I am here to enquire about a product. Please share price, specifications, availability, and delivery time.";
  }

  if (pathname.startsWith("/products/category/")) {
    return "Hi! I am here to enquire about products in this category. Please share price lists and best recommendations.";
  }

  return "Hi! I am here to enquire about your products and services. Please share details and quotation.";
}

export default function EnquireActions() {
  const pathname = usePathname() ?? "/";
  const [productName, setProductName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProductName() {
      setProductName(null);
      if (!pathname.startsWith("/products/") || pathname.startsWith("/products/category/")) return;
      const slug = pathname.split("/").filter(Boolean)[1];
      if (!slug) return;
      try {
        const product = await api.products.getBySlug(slug);
        if (active) setProductName(product.name);
      } catch {
        if (active) setProductName(null);
      }
    }

    void loadProductName();
    return () => {
      active = false;
    };
  }, [pathname]);

  const { waHref, callHref } = useMemo(() => {
    const text = buildWhatsAppText(pathname, productName ?? undefined);
    const waHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    const callHref = `tel:${CALL_PHONE_E164}`;
    return { waHref, callHref };
  }, [pathname, productName]);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col items-end gap-3"
          >
            {/* Social Icons Row */}
            <div className="mb-2 flex gap-2">
              {SOCIAL_LINKS.map(({ key, href, label, icon: Icon, color }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 ${color}`}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>

            {/* Main Action Buttons */}
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-full gradient-accent px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-industrial transition-opacity hover:opacity-90"
            >
              <div className="flex items-center gap-3">
                <MessageCircle size={20} />
                <span>WhatsApp Enquire</span>
              </div>
            </a>

            <a
              href={callHref}
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-full border border-primary-foreground/10 bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-industrial transition-colors hover:border-accent"
            >
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-accent" />
                <span>Call Now</span>
              </div>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
          isOpen ? "bg-primary text-primary-foreground rotate-90" : "gradient-accent text-accent-foreground"
        }`}
        aria-label={isOpen ? "Close Menu" : "Open Contact Menu"}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>
    </div>
  );
}
