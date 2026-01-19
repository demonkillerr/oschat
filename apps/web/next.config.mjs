/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@chat/types", "@chat/ui"],
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
