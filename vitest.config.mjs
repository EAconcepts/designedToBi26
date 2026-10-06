import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile('.env');
} catch {
  // .env may not exist in CI or fresh environments
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    server: {
      deps: {
        inline: ['next-auth'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
    },
  },
});
