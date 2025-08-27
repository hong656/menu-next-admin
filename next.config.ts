// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// If you need options, pass them here (usually empty is fine)
// e.g. createNextIntlPlugin({}) or with a path to request config in older setups.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8080' },
      { protocol: 'http', hostname: 'example.com' }
    ]
  }
};

// Export the wrapped config
export default withNextIntl(nextConfig);