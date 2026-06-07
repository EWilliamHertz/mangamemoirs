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
  serverExternalPackages: ['pdf-parse', 'svix'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // allow large image/video uploads
    },
  },
};

module.exports = nextConfig;
