import { defineConfig } from 'vitest/config';

const COVERAGE_THRESHOLD = 90;
const E2E_TIMEOUT_MS = 5 * 60 * 1000;

export default defineConfig({
  test: {
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        branches: COVERAGE_THRESHOLD,
        functions: COVERAGE_THRESHOLD,
        lines: COVERAGE_THRESHOLD,
        statements: COVERAGE_THRESHOLD,
      },
    },
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
