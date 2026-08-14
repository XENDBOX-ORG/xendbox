import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@xendbox/database": new URL("../../packages/database/src/index.ts", import.meta.url).pathname,
    },
  },
})
