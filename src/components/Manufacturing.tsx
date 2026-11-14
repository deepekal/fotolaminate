"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import factoryImg from "@/assets/factory.jpg";
import Image from "next/image";

const defaultSteps = [
  "In-house Design & Engineering",
  "CNC Precision Machining",
  "Industrial-Grade Material Sourcing",
  "Assembly & Integration",
  "Quality Testing & Calibration",
  "Final Inspection & Packaging",
];

type ManufacturingProps = {
  title?: string;
  description?: string;
  steps?: string[];
};

const Manufacturing = ({
  title = "Manufacturing & Quality",
  description =
    "Every Foto Laminate machine is manufactured in our Delhi facility using industrial-grade materials and precision engineering processes. We control every stage of production to ensure unmatched quality.",
  steps,
}: ManufacturingProps) => {
  const renderedSteps = steps?.length ? steps : defaultSteps;

  return (
    <section id="manufacturing" className="section-padding bg-card">
      <div className="container-max">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Image
            src={factoryImg}
            alt="Foto Laminate manufacturing process"
            className="h-auto w-full rounded-lg shadow-industrial"
            sizes="(min-width: 1024px) 600px, 100vw"
          />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
              Manufacturing Excellence
            </span>
            <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
              {title}
            </h2>
            <p className="mb-8 text-muted-foreground">{description}</p>
            <div className="space-y-3">
              {renderedSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="shrink-0 text-accent" />
                  <span className="text-foreground">
                    <span className="mr-2 font-display font-bold text-accent">0{i + 1}.</span>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Manufacturing;
