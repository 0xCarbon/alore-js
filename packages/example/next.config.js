/** @type {import('next').NextConfig} */

const path = require('path');

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, { isServer }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      include: path.resolve(
        __dirname,
        'node_modules/.pnpm/argon2-browser@1.18.0/node_modules/argon2-browser/dist'
      ),
      exclude: [
        path.resolve(
          __dirname,
          'node_modules/.pnpm/file+..+..+dkls23-wasm+pkg/node_modules/@0xcarbon/dkls23-wasm'
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
