"use client";

import { motion } from "framer-motion";
import { Award, ShieldCheck, BadgeCheck, Trophy } from "lucide-react";

type QualityClientsProps = {
  qualityTitle?: string;
  qualityDescription?: string;
  clientsTitle?: string;
  clientsDescription?: string;
};

const certifications = [
  {
    icon: ShieldCheck,
    title: "IndiaMART Trust Seal",
    desc: "Verified and trusted seller on IndiaMART marketplace.",
  },
  {
    icon: BadgeCheck,
    title: "ISO-Aligned Quality Process",
    desc: "Manufacturing and testing processes aligned with industry quality standards.",
  },
  {
    icon: Trophy,
    title: "25+ Industry Awards",
    desc: "Recognised at SIGN INDIA, MEDIA EXPO, PHOTOFAIR, and other major industry events since 1998.",
  },
  {
    icon: Award,
    title: "PAMA Member",
    desc: "Member of the All Photo Frame Moulding Manufacturer & Trade Association.",
  },
];

const clientTypes = [
  "Photo Studios",
  "Printing & Packaging Firms",
  "Government Offices",
  "Educational Institutions",
  "Event Management Companies",
  "ID Card Manufacturers",
  "Corporate Print Houses",
  "Retail Signage Businesses",
  "Wedding Photography Studios",
  "Medical Documentation Centers",
  "Publishing Houses",
  "Advertising Agencies",
];

const QualityClients = ({
  qualityTitle = "Certifications & Recognitions",
  qualityDescription =
    "Every machine is manufactured and tested to the highest standards. Our quality commitment is backed by industry certifications and decades of recognition.",
  clientsTitle = "Trusted by 5,000+ Businesses Across India",
  clientsDescription =
    "From small photo studios to large government institutions, our machines power professionals across every sector that demands precision finishing.",
}: QualityClientsProps) => (
  <>
    <section className="section-padding bg-muted">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Quality Assurance
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {qualityTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">{qualityDescription}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {certifications.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-lg border border-border bg-white p-6 shadow-industrial text-center hover-lift"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full gradient-accent">
                <c.icon size={26} className="text-accent-foreground" />
              </div>
              <h3 className="mb-2 font-display text-base font-bold text-foreground">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding gradient-navy">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Our Clients
          </span>
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            {clientsTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/70">{clientsDescription}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {clientTypes.map((client, i) => (
            <motion.div
              key={client}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-5 py-2 font-display text-sm font-semibold text-primary-foreground"
            >
              {client}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default QualityClients;
