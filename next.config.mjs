/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Every image in a mockup is either a data: URI the user pasted in or a
     remote URL they typed. Neither goes through next/image — the preview is
     rasterised by html-to-image, which cannot see through a proxying loader —
     so the optimiser is off rather than half-used. */
  images: { unoptimized: true },
  poweredByHeader: false,

  async headers() {
    return [
      {
        /* The avatar set is 240 files that never change: they are content, not
           code, so they are not fingerprinted and would otherwise be
           revalidated on every load. A year, immutable — replacing one means
           adding a file rather than editing one. */
        source: "/avatars/:file*",
        headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }],
      },
      {
        /* The icon atlas is the same 44KB for every mockup anybody ever opens,
           and it is regenerated under a build step rather than edited, so it
           is cached for as long as the avatars are. */
        source: "/discord/:file*",
        headers: [{ key: "cache-control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/favicon.:ext(svg|ico)",
        headers: [{ key: "cache-control", value: "public, max-age=604800" }],
      },
      {
        /* Nothing about a mockup should be cached by a shared proxy: a project
           is somebody's unpublished work, and the backup endpoints answer
           differently per account. */
        source: "/api/mockups/:path*",
        headers: [
          { key: "cache-control", value: "no-store" },
          { key: "x-content-type-options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
