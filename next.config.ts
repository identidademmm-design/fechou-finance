import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const baseConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', // 👈 ESSA LINHA É OBRIGATÓRIA

  experimental: {
    webpackBuildWorker: false,
  },

  webpack: (config) => {
    return config;
  },

  turbopack: {},

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(baseConfig);
