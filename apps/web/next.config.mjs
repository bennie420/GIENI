import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
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
};

export default nextConfig;
