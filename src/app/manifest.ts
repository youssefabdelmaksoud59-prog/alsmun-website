import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALSMUN V",
    short_name: "ALSMUN",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1f3d",
    theme_color: "#0b1f3d",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  };
}
