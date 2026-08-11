/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Dev and production builds MUST NOT share a directory: `next dev` and
  // `next build` writing to the same .next corrupts the dev server's chunk
  // cache (vendor-chunks errors, 500s on /api routes). Dev -> .next-dev.
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Package profiling: reduce client bundle of heavy ESM libs
    optimizePackageImports: ["lucide-react", "framer-motion", "@xyflow/react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;