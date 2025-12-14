/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mobile-first optimizations
  experimental: {
    optimizePackageImports: ['openai'],
  },
  // Performance optimizations for mobile
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

