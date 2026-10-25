/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static site for Cloudflare Pages (files served from R2, API from the Worker)
  reactStrictMode: true,
  images: { unoptimized: true },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.html$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
