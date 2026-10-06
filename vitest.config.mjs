import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile('.env.test');
} catch {
  try {
    process.loadEnvFile('.env');
  } catch {
    // .env may not exist in CI or fresh environments
  }
}

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**', 'app/**'],
      exclude: ['node_modules/**', 'tests/**', '**/*.d.ts'],
    },
    server: {
      deps: {
        inline: ['next-auth'],
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          globals: true,
          include: ['tests/unit/**/*.test.ts'],
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
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          globals: true,
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['./tests/integration/setup.ts'],
          globalSetup: ['./tests/integration/global-setup.ts'],
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
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/server': path.resolve(__dirname, 'node_modules/next/server.js'),
    },
  },
  server: {
    deps: {
      inline: ['next-auth'],
    },
  },
});
