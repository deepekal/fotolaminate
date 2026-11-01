"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import heroImg from "@/assets/hero-machine.jpg";
import factoryImg from "@/assets/factory.jpg";
import rollImg from "@/assets/product-roll.jpg";
import hotImg from "@/assets/product-hot.jpg";
import coldImg from "@/assets/product-cold.jpg";
import industrialImg from "@/assets/product-industrial.jpg";
import photoImg from "@/assets/product-photo.jpg";

const images = [
  { src: "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos1.jpg", alt: "Exhibition highlights" },
  { src: "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos2.jpg", alt: "Industry event" },
  { src: "/assets/Assets/Certificate/Certificate1.png", alt: "IndiaMART Trust Seal" },
  { src: "/assets/Assets/Certificate/Certificate7.png", alt: "MSME Award Certificate" },
  { src: "/assets/Assets/Home/Machine1.jpg", alt: "Cold lamination model" },
  { src: "/assets/Assets/Home/Machine2.jpg", alt: "Professional laminator" },
  { src: "/assets/Assets/Home/ExcellentlyEngineered.png", alt: "Engineering excellence" },
  { src: "/assets/Assets/ExhibitionPhotos/ExhibitionPhotos3.jpg", alt: "Exhibition display" },
];

const Gallery = () => (
  <section id="gallery" className="section-padding bg-muted">
    <div className="container-max">
      <div className="mb-12 text-center">
        <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
          Gallery
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Our Machines & Facility
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`group relative overflow-hidden rounded-lg min-h-[200px] md:min-h-[300px] ${i === 0 || i === 5 ? "row-span-2 md:min-h-[600px]" : ""}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Gallery;
