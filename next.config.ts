import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack filesystem cache can get corrupted when many new files are added.
    // Use in-memory cache until the project stabilises.
    turbopackFileSystemCacheForDev: false,
  },

  webpack(config, { dev, isServer }) {
    if (!dev) {
      // Production builds: spill the webpack module cache to disk instead of RAM.
      // Prevents multi-GB in-memory accumulation during `next build`.
      config.cache = { type: "filesystem" };
    }

    if (!isServer) {
      // @react-pdf/renderer references these Node built-ins but never uses them
      // client-side. Prevent webpack from trying to polyfill them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        canvas: false,
      };
    }

    return config;
  },
};

export default nextConfig;
