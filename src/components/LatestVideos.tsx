"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type LatestVideo = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string;
};

type LatestVideosResponse =
  | {
      ok: true;
      channelId: string;
      channelUrl: string;
      items: LatestVideo[];
    }
  | {
      ok: false;
      error: string;
    };

type LatestVideosProps = {
  limit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
};

const VideoModal = ({ video, onClose }: { video: LatestVideo; onClose: () => void }) => {
  const videoId = video.url.includes("v=") ? video.url.split("v=")[1].split("&")[0] : video.url.split("/").pop();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-white hover:text-accent"
        >
          <span className="text-sm font-bold uppercase tracking-widest">Close</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">✕</div>
        </button>
        <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&modestbranding=1&iv_load_policy=3`}
            title={video.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

const LatestVideos = ({ limit = 3, viewAllHref, viewAllLabel = "View all videos" }: LatestVideosProps) => {
  const [videos, setVideos] = useState<LatestVideo[]>([]);
  const [channelUrl, setChannelUrl] = useState<string>("https://www.youtube.com/@fotolaminate5864");
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<LatestVideo | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/youtube/latest?limit=${encodeURIComponent(String(limit))}`);
        const data = (await res.json()) as LatestVideosResponse;

        if (!res.ok || !data.ok) {
          throw new Error(!data.ok ? data.error : `Failed to load videos (${res.status})`);
        }

        if (!active) return;
        setVideos(data.items);
        setChannelUrl((prev) => data.channelUrl || prev);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load YouTube videos");
        if (active) setVideos([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [limit]);

  return (
    <section className="section-padding bg-card">
      <div className="container-max">
        <div className="mb-12 text-center">
          <span className="mb-2 inline-block font-display text-sm font-bold uppercase tracking-widest text-accent">
            YouTube
          </span>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Latest Videos</h2>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {[0, 1, 2].slice(0, limit).map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-white shadow-industrial">
                <div className="h-48 bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-6 w-5/6 rounded bg-muted" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-6 text-sm text-muted-foreground shadow-industrial">
            No videos found.
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-3">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVideo(v)}
                  className="group overflow-hidden rounded-lg border border-border bg-white text-left shadow-industrial hover-lift"
                  title={v.title}
                >
                  <div className="relative h-48 overflow-hidden bg-white">
                    {v.thumbnailUrl ? (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
                        <svg className="ml-1 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {v.publishedAt ? (
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={14} />
                          {new Date(v.publishedAt).toISOString().slice(0, 10)}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-display text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                      {v.title}
                    </h3>

                    <div className="mt-4 font-display text-sm font-semibold text-accent">Watch Video →</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              {(() => {
                const href = (viewAllHref ?? channelUrl).trim();
                const label = viewAllLabel;
                if (href.startsWith("/")) {
                  return (
                    <Link
                      href={href}
                      className="rounded-md gradient-navy px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {label}
                    </Link>
                  );
                }

                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md gradient-navy px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {label}
                  </a>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </section>
  );
};

export default LatestVideos;
