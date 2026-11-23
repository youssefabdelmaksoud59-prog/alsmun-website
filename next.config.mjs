/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  serverExternalPackages: ["exceljs"],
  outputFileTracingIncludes: { "/api/scores/[code]/pdf": ["./public/icon-192.png"] },
  async redirects() {
    // Old links from before delegates picked their committee first.
    return [
      ...["/amendments", "/resolutions", "/schedule", "/reports"].flatMap((p) => [
        { source: p, destination: "/delegate", permanent: false },
        { source: `${p}/:rest*`, destination: "/delegate", permanent: false },
      ]),
      // The THIMUN guide now lives on the Resources page.
      { source: "/guide", destination: "/resources#thimun-guide", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
