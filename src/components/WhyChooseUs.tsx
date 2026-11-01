"use client";

import { motion } from "framer-motion";
import { Crosshair, HardHat, IndianRupee, Truck, Wrench, Headphones } from "lucide-react";

type WhyChooseUsProps = {
  title?: string;
  reasons?: { title: string; desc: string }[];
};

const defaultReasons = [
  { title: "High Precision Engineering", desc: "CNC-machined components for flawless lamination results." },
  { title: "Durable Industrial Build", desc: "Heavy-gauge steel construction built to last decades." },
  { title: "Affordable Pricing", desc: "Factory-direct pricing with no middleman markup." },
  { title: "Nationwide Supply", desc: "Delivery and installation across all Indian states." },
  { title: "Easy Maintenance", desc: "Modular design with readily available spare parts." },
  { title: "Customer Support", desc: "Dedicated technical support and after-sales service." },
];

const icons = [Crosshair, HardHat, IndianRupee, Truck, Wrench, Headphones] as const;

const WhyChooseUs = ({ title = "Why Choose Foto Laminate?", reasons }: WhyChooseUsProps) => {
  const items = reasons?.length ? reasons : defaultReasons;

  return (
    <section id="why-us" className="section-padding gradient-navy">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Our Advantage
          </span>
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">{title}</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r, i) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div
                key={`${r.title}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-6 transition-colors hover:border-accent/30"
              >
                <Icon className="mb-4 text-accent" size={28} />
                <h3 className="mb-2 font-display text-lg font-bold text-primary-foreground">{r.title}</h3>
                <p className="text-sm text-primary-foreground/60">{r.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
