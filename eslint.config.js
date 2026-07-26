import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  ...pluginVue.configs["flat/recommended"],
  {
    rules: {
      // override/add rules settings here, such as:
      "vue/multi-word-component-names": "off",
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  { ignores: ["dist/"] },
  eslintConfigPrettier,
];
