import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.ts"],
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/effects/**/*.ts", "src/cards/**/*.ts"],
      exclude: [
        "src/effects/**/index.ts",
        "src/effects/**/types.ts",
        "src/effects/effect-context.ts",
        "src/effects/primitive.ts",
        "src/cards/**/index.ts",
        "src/cards/schema/**/*.ts"
      ]
    }
  }
});
