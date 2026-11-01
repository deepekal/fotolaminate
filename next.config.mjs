/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
};

export default nextConfig;
