const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    dirs: ['app', 'components'],
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@alore/auth-react-ui', '@alore/crypto-sdk'],
  webpack(config, { isServer }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      include: path.resolve(
        __dirname,
        '../node_modules/.pnpm/argon2-browser@1.18.0/node_modules/argon2-browser/dist',
      ),
      exclude: [
        path.resolve(
          __dirname,
          '../node_modules/.pnpm/file+..+..+dkls23-wasm+pkg/node_modules/@0xcarbon/dkls23-wasm',
        ),
      ],
      loader: 'base64-loader',
      type: 'javascript/auto',
    });

    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    return config;
  },
};
