import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
  test: {
    env: loadEnv("test", process.cwd(), ""),
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
});
