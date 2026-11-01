import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { Clock, Headset, Wrench } from "lucide-react";

const ContactPage = () => (
  <>
    <Navbar />

    <header className="gradient-navy pt-28 pb-16">
      <div className="container-max px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            Contact
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Sales inquiries, service requests, and support
          </h1>
          <p className="text-lg text-primary-foreground/75">
            Share your requirement and we will respond with pricing, specifications, or service guidance.
          </p>
        </div>
      </div>
    </header>

    <main>
      <section className="section-padding bg-card">
        <div className="container-max">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Headset,
                title: "Pre-Sales Help",
                desc: "Model selection based on width, film type, and expected daily volume.",
              },
              {
                icon: Wrench,
                title: "Service Support",
                desc: "Troubleshooting guidance, spare parts, and maintenance scheduling.",
              },
              {
                icon: Clock,
                title: "Opening Hours",
                desc: "Monday to Saturday: 9:00 AM – 6:00 PM. Closed on Sundays and national holidays.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border bg-muted p-6 shadow-industrial">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-navy text-primary-foreground">
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Contact />
    </main>

    <Footer />
  </>
);

export default ContactPage;
