import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "lib/**/*.ts",
        "app/api/**/*.ts",
        "types/**/*.ts",
      ],
      exclude: [
        "lib/firebase.ts",
        "lib/firebase-admin.ts",
        "lib/invoice-pdf.ts",
        "lib/notifications/whatsapp.ts",
        "lib/notifications/push.ts",
        "lib/notifications/voice.ts",
        "app/api/chat/route.ts",
        "app/api/og/route.tsx",
        "app/api/payments/create-link/**",
        "app/api/notifications/**",
        "app/api/voice/outbound/**",
        "**/*.d.ts",
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
