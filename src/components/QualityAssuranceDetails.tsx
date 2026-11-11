"use client";

import { motion } from "framer-motion";

type QualityAssuranceDetailsProps = {
  title?: string;
  description?: string;
  items?: string[];
};

const defaultItems = [
  "Verified Client Certifications and Success Stories",
  "Standardized Quality Control (QC) Protocols",
  "Authentic Component Sourcing and Verification",
  "Performance Benchmarking for Industrial Durability",
];

const QualityAssuranceDetails = ({
  title = "Quality Assurance by Codalam",
  description =
    "Our commitment to precision is backed by rigorous standards and industry-recognized certifications. We ensure every machine passing through our facility meets the \"Codalam\" quality benchmark.",
  items,
}: QualityAssuranceDetailsProps) => {
  const listItems = items?.length ? items : defaultItems;

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
              Certification & Trust
            </span>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              {title}
            </h2>
            <p className="mb-6 text-lg text-muted-foreground">{description}</p>
            <ul className="space-y-4">
              {listItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground font-semibold">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
              <img
                src="/OurTeam2.jpeg"
                alt="Quality Assurance Team"
                className="h-auto w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-lg gradient-accent opacity-20 -z-10" />
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-lg gradient-navy opacity-20 -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QualityAssuranceDetails;
