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
      "@xendbox/auth": new URL("../../packages/auth/src/index.ts", import.meta.url).pathname,
      "@xendbox/types": new URL("../../packages/types/src/index.ts", import.meta.url).pathname,
      "@xendbox/validation": new URL("../../packages/validation/src/index.ts", import.meta.url).pathname,
      "@xendbox/maps": new URL("../../packages/maps/src/index.ts", import.meta.url).pathname,
      "@xendbox/redis": new URL("../../packages/redis/src/index.ts", import.meta.url).pathname,
      "@xendbox/notifications": new URL("../../packages/notifications/src/index.ts", import.meta.url).pathname,
      "@xendbox/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
    },
  },
})
