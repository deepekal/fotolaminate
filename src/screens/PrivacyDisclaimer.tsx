"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyDisclaimerPage = () => (
  <>
    <Navbar />

    <header className="gradient-navy pt-28 pb-16">
      <div className="container-max px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
            Legal
          </span>
          <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
            Privacy Policy & Disclaimer
          </h1>
          <p className="text-lg text-primary-foreground/75">
            Transparency and trust are at the core of our operations. Here is how we handle your information and the terms of using our services.
          </p>
        </div>
      </div>
    </header>

    <main className="section-padding bg-white">
      <div className="container-max px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Privacy Policy</h2>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                At <strong>Foto Laminate Precision</strong>, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information when you visit our website or interact with our services.
              </p>
              <h3 className="font-display font-bold text-foreground">1. Information Collection</h3>
              <p>
                We may collect personal information such as your name, email address, phone number, and business details when you submit an inquiry through our contact forms or request a catalogue.
              </p>
              <h3 className="font-display font-bold text-foreground">2. Use of Information</h3>
              <p>
                The information collected is used solely to respond to your inquiries, provide technical support, and improve our product offerings. We do not sell or share your personal data with third parties for marketing purposes.
              </p>
              <h3 className="font-display font-bold text-foreground">3. Data Security</h3>
              <p>
                We implement industry-standard security measures to protect your information from unauthorized access, alteration, or disclosure.
              </p>
              <h3 className="font-display font-bold text-foreground">4. Cookies</h3>
              <p>
                Our website may use cookies to enhance your browsing experience and analyze site traffic. You can choose to disable cookies in your browser settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-6 font-display text-2xl font-bold text-foreground">Disclaimer</h2>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                The information provided on this website is for general informational purposes only. While we strive for accuracy, <strong>Foto Laminate Precision</strong> makes no warranties regarding the completeness or reliability of the content.
              </p>
              <h3 className="font-display font-bold text-foreground">1. Product Specifications</h3>
              <p>
                Product images, dimensions, and technical specifications are subject to change without prior notice as we continuously improve our designs. Always verify details with our sales team before purchase.
              </p>
              <h3 className="font-display font-bold text-foreground">2. Operational Safety</h3>
              <p>
                Our photo lamination machines should be operated only by trained personnel according to the provided safety guidelines. We are not liable for damages resulting from improper use or unauthorized modifications.
              </p>
              <h3 className="font-display font-bold text-foreground">3. External Links</h3>
              <p>
                Our website may contain links to third-party sites. We do not endorse and are not responsible for the content or privacy practices of these external websites.
              </p>
              <h3 className="font-display font-bold text-foreground">4. Limitation of Liability</h3>
              <p>
                In no event shall Foto Laminate Precision be liable for any direct, indirect, or consequential losses arising from the use of our website or products.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 rounded-lg border border-border bg-muted p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Last Updated: May 2026. For any questions regarding our policies, please contact us at{" "}
            <a href="mailto:codalam@yahoo.co.in" className="font-semibold text-accent hover:underline">
              codalam@yahoo.co.in
            </a>
          </p>
        </div>
      </div>
    </main>

    <Footer />
  </>
);

export default PrivacyDisclaimerPage;
