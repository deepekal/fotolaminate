"use client";

import { motion } from "framer-motion";
import { Camera, Printer, Store, Building2, Factory, CreditCard } from "lucide-react";

type ApplicationItem = {
  title: string;
  desc: string;
};

type ApplicationsProps = {
  title?: string;
  applications?: ApplicationItem[];
};

const defaultApplications = [
  { title: "Photo Studios", desc: "Professional photo finishing and preservation." },
  { title: "Printing Shops", desc: "High-volume commercial print lamination." },
  { title: "Retail Stores", desc: "Menu cards, posters, and display materials." },
  { title: "Government Offices", desc: "Document protection and archival lamination." },
  { title: "Industrial Printing Units", desc: "Packaging and industrial label lamination." },
  { title: "ID Card Manufacturing", desc: "Secure lamination for identity cards." },
];

const icons = [Camera, Printer, Store, Building2, Factory, CreditCard] as const;

const Applications = ({
  title = "Where Our Machines Are Used",
  applications,
}: ApplicationsProps) => {
  const items = applications?.length ? applications : defaultApplications;

  return (
    <section className="section-padding bg-muted">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Applications
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div
                key={`${a.title}-${i}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-start gap-4 rounded-lg bg-white p-5 shadow-industrial hover-lift"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg gradient-accent text-accent-foreground">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Applications;
