import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client (~100MB) -- linting it is pointless and was by
    // far the slowest part of a lint run.
    "app/generated/**",
    // Raw Discord export archive: ~13GB across ~9500 files. ESLint does not
    // read .gitignore, so without this it walks the whole tree and a lint run
    // takes many minutes.
    "market-research/**",
  ]),
]);

export default eslintConfig;
