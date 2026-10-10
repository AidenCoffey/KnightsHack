/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Allow Leaflet images
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
