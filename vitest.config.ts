import { defineConfig } from 'vitest/config';

const E2E_TIMEOUT_MS = 2 * 60 * 1000;

export default defineConfig({
  test: {
    globals: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          environment: 'node',
          include: ['e2e/**/*.test.ts'],
          testTimeout: E2E_TIMEOUT_MS,
          hookTimeout: E2E_TIMEOUT_MS,
          fileParallelism: false,
          maxWorkers: 1,
        },
      },
    ],
  },
});
