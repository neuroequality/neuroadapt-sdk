/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    transpilePackages: ['@neuroadapt/core', '@neuroadapt/ai'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig