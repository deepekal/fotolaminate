"use client";

import { motion } from "framer-motion";
import factoryImg from "@/assets/factory.jpg";
import Image from "next/image";

type AboutProps = {
  title?: string;
  paragraph1?: string;
  paragraph2?: string;
};

const stats = [
  { value: "25+", label: "Years of Experience" },
  { value: "5,000+", label: "Machines Sold in India" },
  { value: "100+", label: "Corporate Print Houses" },
  { value: "250+", label: "Repeat Orders" },
];

const About = ({
  title = "About Foto Laminate",
  paragraph1 =
    "M/S MELA RAM & SONS is a well-known name in photographers and photo goods supplies. Our journey began in Peshawar Cantt and expanded across India to serve major cities with professional photo solutions.",
  paragraph2 =
    "Since progressing from photo printing to photo lamination, we have specialised in photofinishing equipment and allied materials, especially cold lamination product lines. Today, we support thousands of businesses with durable machines, dependable service, and factory-direct value.",
}: AboutProps) => (
  <section id="about" className="section-padding bg-card">
    <div className="container-max">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            About Us
          </span>
          <h2 className="mb-6 font-display text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="mb-4 leading-relaxed text-muted-foreground">{paragraph1}</p>
          <p className="mb-8 leading-relaxed text-muted-foreground">{paragraph2}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-muted p-4 text-center">
                <div className="font-display text-2xl font-bold text-accent">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <Image
            src={factoryImg}
            alt="Foto Laminate manufacturing facility"
            className="h-auto w-full rounded-lg shadow-industrial"
            sizes="(min-width: 1024px) 600px, 100vw"
          />
          <div className="absolute -bottom-4 -left-4 rounded-lg gradient-navy p-4 text-primary-foreground shadow-lg">
            <div className="font-display text-2xl font-bold">ISO Aligned</div>
            <div className="text-xs text-primary-foreground/70">Quality Process</div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default About;
