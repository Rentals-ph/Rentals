/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      // Production (Railway)
      {
        protocol: 'https',
        hostname: 'rentalsbackend-production.up.railway.app',
        pathname: '/storage/**',
      },
    ],
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/rent-managers', destination: '/agents', permanent: true },
      { source: '/rent-managers/:path*', destination: '/agents/:path*', permanent: true },
    ]
  },
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
      (process.env.VERCEL ? 'https://rentalsbackend-production.up.railway.app' : 'http://127.0.0.1:8000')
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig