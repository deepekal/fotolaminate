import { NextResponse } from "next/server";
import { load } from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LatestVideo = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  thumbnailUrl: string;
};

type YouTubeOEmbed = {
  author_url?: string;
};

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = value ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function extractYouTubeChannelId(html: string): string | null {
  const fromJson = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
  if (fromJson?.[1]) return fromJson[1];

  const fromUrl = html.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (fromUrl?.[1]) return fromUrl[1];

  return null;
}

function extractChannelIdFromUrl(url: string): string | null {
  const m = url.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

async function safeReadText(res: Response, limit = 400): Promise<string> {
  try {
    const text = await res.text();
    return text.length > limit ? `${text.slice(0, limit)}…` : text;
  } catch {
    return "";
  }
}

async function resolveChannelId(): Promise<string | null> {
  const explicit = process.env.YOUTUBE_CHANNEL_ID?.trim();
  if (explicit && /^UC[a-zA-Z0-9_-]{10,}$/.test(explicit)) return explicit;

  const channelPageUrl = (process.env.YOUTUBE_LINK || "https://www.youtube.com/@fotolaminate5864").trim();
  if (!channelPageUrl) return null;

  const direct = extractChannelIdFromUrl(channelPageUrl);
  if (direct) return direct;

  // Prefer oEmbed (JSON) over scraping the full HTML, when possible.
  try {
    const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(channelPageUrl)}`;
    const oembedRes = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (oembedRes.ok) {
      const data = (await oembedRes.json()) as YouTubeOEmbed;
      const fromAuthor = data.author_url ? extractChannelIdFromUrl(data.author_url) : null;
      if (fromAuthor) return fromAuthor;
    }
  } catch {
    // ignore
  }

  const res = await fetch(channelPageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const html = await res.text();
  return extractYouTubeChannelId(html);
}

function parseLatestVideosFromFeed(xml: string, limit: number): LatestVideo[] {
  const $ = load(xml, { xmlMode: true });

  return $("entry")
    .toArray()
    .slice(0, limit)
    .map((entry) => {
      const el = $(entry);
      const title = el.find("title").first().text().trim();
      const url = el.find('link[rel="alternate"]').attr("href")?.trim() || "";
      const publishedAt = el.find("published").first().text().trim();

      const id =
        el.find("yt\\:videoId").first().text().trim() ||
        el.find("id").first().text().trim().split(":").pop()?.trim() ||
        "";

      const thumbnailUrl =
        el.find("media\\:thumbnail").first().attr("url")?.trim() ||
        (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");

      return {
        id,
        title,
        url,
        publishedAt,
        thumbnailUrl,
      };
    })
    .filter((v) => v.id && v.title && v.url);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = clampInt(searchParams.get("limit"), 3, 1, 12);

  try {
    const channelId = await resolveChannelId();
    if (!channelId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unable to resolve YouTube channel id. Set YOUTUBE_CHANNEL_ID or YOUTUBE_LINK in your environment.",
        },
        { status: 500 },
      );
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const bodyPreview = await safeReadText(res);
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to fetch YouTube feed (${res.status}). ${bodyPreview ? `Response: ${bodyPreview}` : ""}`.trim(),
        },
        { status: 502 },
      );
    }

    const xml = await res.text();
    const items = parseLatestVideosFromFeed(xml, limit);

    const channelUrl = (process.env.YOUTUBE_LINK || "https://www.youtube.com/@fotolaminate5864").trim();

    return NextResponse.json(
      { ok: true, channelId, channelUrl, items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load YouTube videos",
      },
      { status: 500 },
    );
  }
}
