import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // ESLint 10: eslint-plugin-react's version "detect" calls the removed
  // context.getFilename(). Pin the version until vercel/next.js#89764 lands.
  { settings: { react: { version: "19.3" } } },
  {
    rules: {
      // Allow `const { [id]: _, ...rest } = obj` to omit a key.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
