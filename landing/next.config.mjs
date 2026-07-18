/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static site for Cloudflare Pages (files served from R2, API from the Worker)
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
