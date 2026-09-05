/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Every image in a mockup is either a data: URI the user pasted in or a
     remote URL they typed. Neither goes through next/image — the preview is
     rasterised by html-to-image, which cannot see through a proxying loader —
     so the optimiser is off rather than half-used. */
  images: { unoptimized: true },
};

export default nextConfig;
