/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ["images.unsplash.com", "muiwsfsguvgqftolfean.supabase.co"],
  },
};

module.exports = nextConfig;
