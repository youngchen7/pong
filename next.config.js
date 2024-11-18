/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/pong/lobby',
      },
    ]
  },
  reactStrictMode: true,
}

module.exports = nextConfig
