"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    text: "Reliable lamination machines with excellent durability. We've been using Foto Laminate machines for 5 years without a single breakdown.",
    name: "Rajesh Kumar",
    business: "Photo Studio Owner, Mumbai",
  },
  {
    text: "The best lamination equipment we've purchased. The quality of lamination is consistent and the after-sales support is outstanding.",
    name: "Priya Sharma",
    business: "Printing Business, Bangalore",
  },
  {
    text: "Factory-direct pricing with industrial-grade quality. Our production efficiency improved by 40% after switching to Foto Laminate machines.",
    name: "Amit Verma",
    business: "ID Card Manufacturer, Delhi",
  },
];

const Testimonials = () => (
  <section className="section-padding gradient-navy">
    <div className="container-max">
      <div className="mb-12 text-center">
        <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
          Testimonials
        </span>
        <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
          What Our Clients Say
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-6"
          >
            <div className="mb-4 flex gap-1">
              {[...Array(5)].map((_, j) => (
                <Star key={j} size={16} className="fill-accent text-accent" />
              ))}
            </div>
            <p className="mb-6 text-sm leading-relaxed text-primary-foreground/70">"{t.text}"</p>
            <div>
              <div className="font-display font-bold text-primary-foreground">{t.name}</div>
              <div className="text-xs text-primary-foreground/50">{t.business}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
