import path from 'path';
import { fileURLToPath } from 'url';
import { withSentryConfig } from '@sentry/nextjs/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@gieni/county-adapters',
    '@gieni/database',
    '@gieni/authz',
    '@gieni/evidence',
    '@gieni/property',
    '@gieni/ownership',
    '@gieni/authority',
    '@gieni/scoring',
    '@gieni/workflow',
    '@gieni/qc',
    '@gieni/delivery',
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@gieni/county-adapters': path.resolve(__dirname, '../../packages/county-adapters/src/index.ts'),
    };
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'gieni-os',
  project: process.env.SENTRY_PROJECT || 'gieni-web',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
});