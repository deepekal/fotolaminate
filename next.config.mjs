/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    // Uploaded images get a new file name when replaced, so resized copies can be cached long.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fotolaminate.com",
      },
      {
        protocol: "https",
        hostname: "www.fotolaminate.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
    ],
  },
  async headers() {
    // Images served straight from public/ (old WordPress paths, logo, team photo).
    const week = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return ["/2024/:path*", "/2025/:path*", "/assets/:path*", "/logo-:size.webp", "/OurTeam2.jpeg"].map((source) => ({
      source,
      headers: week,
    }));
  },
};

export default nextConfig;
