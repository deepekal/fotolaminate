"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}
