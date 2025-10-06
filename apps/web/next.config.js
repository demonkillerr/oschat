/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  async rewrites() {
    // Dev proxy to backend server (api + socket.io path)
    return [
      { source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' },
      { source: '/socket.io/:path*', destination: 'http://localhost:4000/socket.io/:path*' }
    ];
  }
};

module.exports = nextConfig;

