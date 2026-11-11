"use client";

import { motion } from "framer-motion";
import { Shield, Factory, Users, Youtube, Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import heroImg from "@/assets/hero-machine.jpg";

const badges = [
  { icon: Shield, label: "Made in India" },
  { icon: Factory, label: "Industrial Grade" },
  { icon: Users, label: "Trusted by Businesses" },
];

const SOCIAL_LINKS = [
  {
    key: "youtube",
    label: "YouTube",
    href: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/@fotolaminate5864",
    icon: Youtube,
  },
  {
    key: "instagram",
    label: "Instagram",
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/fotolaminate",
    icon: Instagram,
  },
  {
    key: "facebook",
    label: "Facebook",
    href: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/fotolaminate/",
    icon: Facebook,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "https://www.linkedin.com/company/fotolaminate/",
    icon: Linkedin,
  },
  {
    key: "x",
    label: "X (Twitter)",
    href: process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/fotolaminate",
    icon: Twitter,
  },
] as const;

import Image from "next/image";

type HeroProps = {
  title?: string;
  description?: string;
  badge?: string;
};

const Hero = ({
  title = "Leading Manufacturer of Photo Lamination Machine at an Affordable Price in Delhi, India",
  description =
    "Discover top-quality photo lamination machines designed for long-lasting performance and professional results. Trusted across India for reliability, durability, and precision for industrial, retail, public sector, and business use.",
  badge = "DELHI, INDIA",
}: HeroProps) => (
  <section id="home" className="relative w-full overflow-hidden">
    <Image
      src={heroImg}
      alt="Photo lamination machine by Foto Laminate"
      fill
      priority
      className="object-cover"
      sizes="100vw"
    />
    <div className="gradient-overlay absolute inset-0" />

    <div className="relative z-10 flex min-h-[100svh] items-start pt-28 pb-16 md:pt-32 md:pb-20">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          <span className="mb-4 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            {badge}
          </span>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/70">{description}</p>

          <div className="flex flex-wrap gap-4">
            <a
              href="#products"
              className="gradient-accent rounded-md px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-transform hover:scale-105"
            >
              View Machines
            </a>
            <a
              href="#contact"
              className="rounded-md border border-primary-foreground/30 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Get Quote
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-6">
            {badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-primary-foreground/70">
                <Icon size={18} className="text-accent" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default Hero;
