"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AwardItem = {
  id: string;
  title: string;
  year?: number;
  imageUrl: string;
};

const awards: AwardItem[] = [
  {
    id: "award-1",
    title: "PUNJAB PHOTO FAIR LUDHIANA AWARD IN 2015",
    year: 2015,
    imageUrl: "/2024/07/20-ptif.png"
  },
  {
    id: "award-2",
    title: "INDIA SIGN DIGITAL PRAGATI MAIDAN AT NEW DELHI AWARD IN 2012",
    year: 2012,
    imageUrl: "/2024/07/19-ptif.png"
  },
  {
    id: "award-3",
    title: "SIGNAGE INDUSTRY EXHIBITION SIGN INDIA AWARD IN 2013",
    year: 2013,
    imageUrl: "/2024/07/14-ptif.png"
  },
  {
    id: "award-4",
    title: "PRINT PACK INDIA INDIA EXPO CENTER GREATER NOIDA AWARD",
    imageUrl: "/2024/07/15-ptif.png"
  },
  {
    id: "award-5",
    title: "ALL INDIA PHOTOGRAPHIC TRADE & INDUSTRY ASSOCIATION PHOTOFAIR AWARD IN 2006",
    year: 2006,
    imageUrl: "/2024/07/13-ptif.png"
  },
  {
    id: "award-6",
    title: "ALL INDIA PHOTOGRAPHIC TRADE & INDUSTRY ASSOCIATION PHOTOFAIR AWARD IN 2015",
    year: 2015,
    imageUrl: "/2024/07/16-ptif.png"
  },
  {
    id: "award-7",
    title: "HARYANA PHOTOGRAPHIC ASSOCIATION PHOTO FAIR AWARD IN 2014",
    year: 2014,
    imageUrl: "/2024/07/6-ptif.png"
  },
  {
    id: "award-8",
    title: "NATIONAL VIDEO FOTO FAIR AWARD IN 2018",
    year: 2018,
    imageUrl: "/2024/07/7-ptif.png"
  },
  {
    id: "award-9",
    title: "MEDIA EXPO PRAGATI MAIDAN, NEW DELHI AWARD IN 2012",
    year: 2012,
    imageUrl: "/2024/07/8-ptif.png"
  },
  {
    id: "award-10",
    title: "DIGITAL PHOTO VIDEO EXPO AWARD IN 1998",
    year: 1998,
    imageUrl: "/2024/07/9-ptif.png"
  },
  {
    id: "award-11",
    title: "PUNJAB PHOTO FAIR LUDHIANA AWARD IN 2014",
    year: 2014,
    imageUrl: "/2024/07/10-ptif.png"
  },
  {
    id: "award-12",
    title: "PAMA ALL PHOTO FRAME MOULDING MANUFACTURE & TRADE ASSOCIATION PHOTO VIDEO ASIA AWARD IN 2017",
    year: 2017,
    imageUrl: "/2024/07/11-ptif.png"
  },
  {
    id: "award-13",
    title: "SIGN TODAY AWARD IN 2006",
    year: 2006,
    imageUrl: "/2024/07/12-ptif.png"
  },
  {
    id: "award-14",
    title: "PATIALA PHOTOGRAPHIC CLUB ASSOCIATION AWARD IN 2011",
    year: 2011,
    imageUrl: "/2024/07/3-ptif.png"
  },
  {
    id: "award-15",
    title: "PUNJAB PHOTO VIDEO EXPO LUDHIANA AWARD IN 2012",
    year: 2012,
    imageUrl: "/2024/07/4-ptif.png"
  },
  {
    id: "award-16",
    title: "MEDIA EXPO BOMBAY EXHIBITION CENTER AWARD IN 2014",
    year: 2014,
    imageUrl: "/2024/07/5-ptif.png"
  },
  {
    id: "award-17",
    title: "SIGNAGE INDUSTRY EXHIBITION SIGN INDIA AWARD IN 2019",
    year: 2019,
    imageUrl: "/2024/07/21-ptif.png"
  },
  {
    id: "award-18",
    title: "MEDIA EXPO PRAGATI MAIDAN AT NEW DELHI AWARD IN 2011",
    year: 2011,
    imageUrl: "/2024/07/22-ptif.png"
  },
  {
    id: "award-19",
    title: "PAMA ALL PHOTO FRAME MOULDING MANUFACTURER & TRADE ASSOCIATION AWARD",
    imageUrl: "/2024/07/23-ptif.png"
  },
  {
    id: "award-20",
    title: "PRINT PACK INDIA INDIA EXPO CENTER GREATER NOIDA AWARD IN 2015",
    year: 2015,
    imageUrl: "/2024/07/24-ptif.png"
  },
  {
    id: "award-21",
    title: "MEDIA EXPO PRAGATI MAIDAN AT NEW DELHI AWARD IN 2013",
    year: 2013,
    imageUrl: "/2024/07/25-ptif.png"
  },
  {
    id: "award-22",
    title: "ALL INDIA PHOTOGRAPHIC TRADE & INDUSTRY ASSOCIATION IN PHOTOFAIR AWARD IN 2009",
    year: 2009,
    imageUrl: "/2024/07/1-2-1.jpg"
  },
  {
    id: "award-23",
    title: "SIGN INDIA AWARD IN 2017",
    year: 2017,
    imageUrl: "/2024/07/2-ptif-1.png"
  },
  {
    id: "award-24",
    title: "HARYANA PHOTOGRAPHIC ASSOCIATION PHOTOFAIR AWARD IN 2012-1",
    year: 2012,
    imageUrl: "/HARYANA PHOTOGRAPHIC ASSOCIATION PHOTOFAIR AWARD IN 2012-1.jpg"
  },
  {
    id: "award-25",
    title: "MEDIA EXPO PRAGATI MAIDAN AT NEW DELHI AWARD IN 2015-2",
    year: 2015,
    imageUrl: "/MEDIA EXPO PRAGATI MAIDAN AT NEW DELHI AWARD IN 2015-2.jpg"
  },
];


export default function AwardsPage() {
  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max px-4 md:px-8 lg:px-16">
          <div className="max-w-3xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Awards
            </span>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Awards and Accolades
            </h1>
            <p className="text-lg text-primary-foreground/75">
              A snapshot of recognitions and awards received over the years.
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-muted/30">
          <div className="container-max">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {awards
                .slice()
                .sort((a, b) => {
                  if (typeof a.year === "number" && typeof b.year === "number") return b.year - a.year;
                  if (typeof a.year === "number") return -1;
                  if (typeof b.year === "number") return 1;
                  return a.id.localeCompare(b.id);
                })
                .map((award) => (
                  <div key={award.id} className="group flex flex-col items-center">
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-white p-4 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md">
                      <img
                        src={award.imageUrl}
                        alt={award.title}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      {typeof award.year === "number" && (
                        <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary backdrop-blur-sm">
                          {award.year}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 w-full px-1 text-center">
                      <div className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground/80 transition-colors group-hover:text-primary">
                        {award.title}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
