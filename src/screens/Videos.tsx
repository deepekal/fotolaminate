"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LatestVideos from "@/components/LatestVideos";

export default function VideosPage() {
  const channelUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/@fotolaminate5864";

  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-16">
        <div className="container-max">
          <div className="max-w-3xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Videos
            </span>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Latest videos
            </h1>
            <p className="text-lg text-primary-foreground/75">
              Watch product demos, manufacturing highlights, and customer applications.
            </p>
          </div>
        </div>
      </header>

      <main>
        <LatestVideos limit={12} viewAllHref={channelUrl} viewAllLabel="Visit YouTube channel" />
      </main>

      <Footer />
    </>
  );
}
