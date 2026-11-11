"use client";

import { Phone, Youtube, Instagram, Facebook, Linkedin, Twitter, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_PHONE = "919873684816";
// Official WhatsApp glyph (Simple Icons, CC0) — lucide has no WhatsApp icon.
const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

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
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-full bg-[#25D366] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-industrial transition-colors hover:bg-[#1EBE57]"
            >
              <div className="flex items-center gap-3">
                <WhatsAppIcon size={20} />
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
          isOpen ? "bg-primary text-primary-foreground rotate-90" : "bg-[#25D366] text-white hover:bg-[#1EBE57]"
        }`}
        aria-label={isOpen ? "Close Menu" : "Open Contact Menu"}
      >
        {isOpen ? <X size={28} /> : <WhatsAppIcon size={30} />}
      </button>
    </div>
  );
}
