/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'inmscdjhwoojbmlerxbb.supabase.co' },
      { protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
      { protocol: 'https', hostname: '**.replicate.delivery' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  experimental: { serverComponentsExternalPackages: ['pdf-parse'] },
};

module.exports = nextConfig;
