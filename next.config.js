/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mobile-first optimizations
  experimental: {
    optimizePackageImports: ['@anthropic-ai/sdk'],
  },
  // Performance optimizations for mobile
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

