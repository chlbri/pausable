import { aliasTs } from '@bemedev/vitest-alias';
import { defineConfig, defaultExclude } from 'vitest/config';
import tsconfig from './tsconfig.json';

export default defineConfig({
  test: {
    bail: 10,
    maxConcurrency: 10,
    passWithNoTests: true,
    slowTestThreshold: 3000,
    globals: true,
    logHeapUsage: true,
    coverage: {
      enabled: true,
      extension: 'ts',
      reportsDirectory: '.coverage',
      all: true,
      provider: 'v8',
      exclude: [...defaultExclude, '**/*/types.ts'],
    },
    projects: [
      {
        extends: true,
        plugins: [aliasTs(tsconfig as any)],
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        },
      },
    ],
  },
});
