"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type ContactProps = {
  title?: string;
  description?: string;
};

const Contact = ({
  title = "Contact & Inquiry",
  description = "Share your requirement and we will respond with pricing, specifications, or service guidance.",
}: ContactProps) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", machineType: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbzA4tiDnbgQKxEynU8UVgEqdakEiuVRFwfBpikvc-IGBfLmXpcX2yWvH4N90VwwPFEzGw/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify(form),
        }
      );
      toast.success("Thank you! We'll contact you shortly.");
      setForm({ name: "", phone: "", email: "", machineType: "", message: "" });
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    }
  };

  return (
    <section id="contact" className="section-padding bg-muted">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            Get In Touch
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.form
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg bg-card p-6 shadow-industrial"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Your Name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                maxLength={15}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              required
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            <select
              value={form.machineType}
              onChange={(e) => setForm({ ...form, machineType: e.target.value })}
              className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="">Select Machine Type</option>
              <option>Cold Lamination Machine</option>
              <option>Canvera Photo Album Making Machine</option>
              <option>Karizma Photo Album Making Machine</option>
              <option>Photo Frame Cutting Machine</option>
              <option>Hot Gluing Machine</option>
              <option>Grooving Machine</option>
              <option>UV Coating Machine</option>
              <option>Round Corner Cutter Machine</option>
              <option>PVC Cold Lamination Roll</option>
              <option>Machine Accessories &amp; Raw Materials</option>
            </select>
            <textarea
              placeholder="Your Message"
              rows={4}
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-md gradient-accent py-3 font-display text-sm font-bold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
            >
              Send Inquiry
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-industrial text-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                <Phone size={18} />
              </div>
              <p className="text-sm font-medium text-foreground">
                For Any Help Line &amp; Enquiry Call : <a href="tel:+919873184816" className="text-accent hover:underline">+91 9873184816</a>, <a href="tel:+919873684816" className="text-accent hover:underline">9873684816</a>
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-industrial">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                <MessageCircle size={18} />
              </div>
              <a href="https://wa.me/919873684816" className="text-sm font-medium text-accent hover:underline">
                WhatsApp Us
              </a>
            </div>

            <div className="flex items-center gap-4 rounded-lg bg-card p-4 shadow-industrial">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                <Mail size={18} />
              </div>
              <a href="mailto:codalam@yahoo.co.in" className="text-sm font-medium text-accent hover:underline">
                codalam@yahoo.co.in
              </a>
            </div>

            <div className="flex items-start gap-4 rounded-lg bg-card p-4 shadow-industrial">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                <MapPin size={18} />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">Factory Address</p>
                <p className="text-sm font-medium text-foreground">
                  Ground Floor, House No. 87/570/II4, Maidan Garhi, New Delhi - 110030
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg bg-card p-4 shadow-industrial">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                <MapPin size={18} />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">Corporate Office Address</p>
                <p className="text-sm font-medium text-foreground">
                  Shop No. 3, Suman Market, 1st Floor, Esplanade Road, Chandni Chowk,<br /> Delhi - 110006.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg shadow-industrial">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
              <MapPin size={12} className="inline mr-1 text-accent" />
              Shop — Chandni Chowk, Delhi
            </p>
            <iframe
              title="Foto Laminate Shop Location"
              src="https://maps.google.com/maps?q=Suman+Market+Esplanade+Road+Chandni+Chowk+Delhi+110006&output=embed"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="overflow-hidden rounded-lg shadow-industrial">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
              <MapPin size={12} className="inline mr-1 text-accent" />
              Factory — Maidan Garhi, New Delhi
            </p>
            <iframe
              title="Foto Laminate Factory Location"
              src="https://maps.google.com/maps?q=28.501222,77.196472&output=embed"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
