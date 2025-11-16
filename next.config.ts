import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Ignora avisos e erros do ESLint durante o build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Ignora erros de tipagem do TypeScript durante o build
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
