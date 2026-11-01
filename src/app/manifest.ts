import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const name = "Foto Laminate Precision";

  return {
    name,
    short_name: "Foto Laminate",
    description: "Industrial photo lamination machines and finishing solutions.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
