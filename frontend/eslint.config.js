import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import pluginVitest from "eslint-plugin-vitest";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,vue}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: { globals: globals.node },
  },
  pluginVue.configs["flat/essential"],
  {
    files: ["**/*.test.{js,mjs}", "**/*.spec.{js,mjs}"],
    plugins: { vitest: pluginVitest },
    languageOptions: { globals: pluginVitest.environments.env.globals },
  },
]);
