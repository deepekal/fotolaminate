"use client";

import { Factory, Award, Users } from "lucide-react";

type GrowingCompanyProps = {
  title?: string;
  description?: string;
  stats?: { value: string; label: string }[];
};

const defaultStats = [
  { icon: Award, value: "25+", label: "Years Experience" },
  { icon: Users, value: "5,000+", label: "Machines Sold" },
  { icon: Factory, value: "100+", label: "Corporate Print Houses" },
  { icon: Award, value: "250+", label: "Repeat Orders" },
];

const GrowingCompany = ({
  title = "We are a Growing Company",
  description = "Foto Laminate Precision is a manufacturing pioneer in India.",
  stats,
}: GrowingCompanyProps) => {
  const getIcon = (label: string, index: number) => {
    const l = label.toLowerCase();
    if (l.includes("year") || l.includes("experience")) return Award;
    if (l.includes("machine") || l.includes("sold")) return Users;
    if (l.includes("corporate") || l.includes("house") || l.includes("unit")) return Factory;
    if (l.includes("repeat") || l.includes("order")) return Award;
    return defaultStats[index % defaultStats.length]?.icon ?? Factory;
  };

  const statItems =
    stats?.length && stats.length > 0
      ? stats.map((stat, i) => ({
          icon: getIcon(stat.label, i),
          value: stat.value,
          label: stat.label,
        }))
      : defaultStats;

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32 border-t border-border">
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <svg
          viewBox="0 0 1200 400"
          className="h-full w-full scale-110"
          preserveAspectRatio="none"
        >
          <path
            d="M-50,300 L150,200 L300,350 L450,150 L600,300 L750,100 L900,250 L1050,50 L1200,200 L1350,100"
            fill="none"
            stroke="currentColor"
            strokeWidth="15"
            className="text-foreground"
          />
        </svg>
      </div>

      <div className="container-max relative z-10">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {title.split(" ").map((word, index) => (
              <span key={index} className={word === "Growing" ? "text-primary" : ""}>
                {word}
                {index < title.split(" ").length - 1 ? " " : ""}
              </span>
            ))}
          </h2>
          <p className="mx-auto mt-6 text-xl font-medium text-muted-foreground md:text-2xl max-w-2xl">
            {description}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {statItems.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-industrial hover:border-accent/20"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <item.icon size={40} strokeWidth={1.5} />
              </div>
              <div className="font-display text-5xl font-black text-foreground tabular-nums tracking-tight">
                {item.value}
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GrowingCompany;
