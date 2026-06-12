import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Single source of truth = the imperative .js engine. These .ts tests import
    // and exercise the live .js modules. The retired TS engine + its tests live in
    // /_archive/ and are never run.
    include: ["tests/**/*.ts"],
    exclude: ["**/node_modules/**", "**/_archive/**"],
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.js"],
      exclude: ["**/_archive/**", "src/**/index.js"]
    }
  }
});
