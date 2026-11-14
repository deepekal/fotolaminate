"use client";

import { useEffect } from "react";

const GTM_ID = "GTM-KNCTP7TN";
const GTAG_ID = "AW-17914852419";
const GA4_ID = "G-801HN559VK";

// Tracking scripts (GTM, Google Ads, GA4 and the Facebook pixel that GTM loads)
// are ~500 KB of JavaScript. Load them on the visitor's first interaction, or
// after 15 seconds for people who only read, so they don't slow the first view.
const TRIGGERS = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"] as const;

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export default function Analytics() {
  useEffect(() => {
    const w = window as typeof window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    // Queue calls right away; the scripts process the queue when they arrive.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", GTAG_ID);
    w.gtag("config", GA4_ID);

    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      cleanup();
      w.dataLayer!.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      addScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
      addScript(`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`);
    };
    const timer = window.setTimeout(load, 15000);
    const cleanup = () => {
      window.clearTimeout(timer);
      TRIGGERS.forEach((e) => window.removeEventListener(e, load));
    };
    TRIGGERS.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));
    return cleanup;
  }, []);

  return null;
}
