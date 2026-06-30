import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  target: 'node24',
  minify: true,
  fixedExtension: false,
  deps: {
    onlyBundle: false,
  },
});
