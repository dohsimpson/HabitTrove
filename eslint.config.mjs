import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const customEslintRules = {
  plugins: {
    "unused-imports": unusedImports,
  },
  rules: {
    "unused-imports/no-unused-imports": "warn",
    "@typescript-eslint/no-unused-vars": "off",
    "react/no-unescaped-entities": 0
  },
}

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  customEslintRules,
];

export default eslintConfig;
