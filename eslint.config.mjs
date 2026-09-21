import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next のデフォルトの ignore 設定を上書き
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ツールリング生成物・ローカル作業領域はリント対象外
    ".gitnexus/**",
    ".claude/**",
    "tmp/**",
  ]),
]);

export default eslintConfig;
