import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import type { PageContent, PageField, PageFAQ } from "@/lib/page-types";

function renderField(field: PageField, index: number) {
  switch (field.key) {
    case "h1":
      return (
        <h1 key={index} className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
          {field.value}
        </h1>
      );
    case "h2":
      return (
        <h2 key={index} className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
          {field.value}
        </h2>
      );
    case "h3":
      return (
        <h3 key={index} className="mb-4 font-display text-2xl font-bold text-foreground">
          {field.value}
        </h3>
      );
    case "p":
      return (
        <p key={index} className="mb-4 leading-relaxed text-muted-foreground">
          {field.value}
        </p>
      );
    case "image":
      return field.value ? (
        <div key={index} className="mb-4 overflow-hidden rounded-xl border border-border bg-muted">
          <img src={field.value} alt={field.label} className="w-full object-cover" />
        </div>
      ) : null;
    default:
      return null;
  }
}

const StaticPage = ({ page }: { page: PageContent | null }) => {
  if (!page) {
    return (
      <>
        <Navbar />
        <main className="section-padding bg-white pt-28">
          <div className="container-max">
            <div className="rounded-lg border border-border bg-muted p-8 text-center text-muted-foreground">
              Page content could not be loaded.
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [heroSection, ...restSections] = page.sections;

  return (
    <>
      <Navbar />
      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max">
          <div className="max-w-4xl">
            {heroSection?.title ? (
              <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
                {heroSection.title}
              </span>
            ) : null}
            <div className="mt-4">{heroSection?.fields?.map(renderField)}</div>
          </div>
        </div>
      </header>

      <main>
        {restSections.map((section) => {
          if (section.type === "faq" && section.faqs) {
            return (
              <section key={section.id} className="section-padding bg-white">
                <div className="container-max">
                  <div className="max-w-4xl">
                    {section.title ? (
                      <span className="mb-6 inline-block font-display text-sm font-semibold uppercase tracking-widest text-accent">
                        {section.title}
                      </span>
                    ) : null}
                    <FAQ faqs={section.faqs as PageFAQ[]} />
                  </div>
                </div>
              </section>
            );
          }

          return (
            <section key={section.id} className="section-padding bg-white">
              <div className="container-max">
                <div className="max-w-4xl">
                  {section.title ? (
                    <span className="mb-3 inline-block font-display text-sm font-semibold uppercase tracking-widest text-accent">
                      {section.title}
                    </span>
                  ) : null}
                  <div>{section.fields?.map(renderField)}</div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      <Footer />
    </>
  );
};

export default StaticPage;
