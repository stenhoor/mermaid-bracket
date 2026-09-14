import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts'],
    alias: { obsidian: new URL('./packages/obsidian-plugin/test/obsidian-stub.ts', import.meta.url).pathname },
  },
});
