import globals from "globals";
import pluginReact from "eslint-plugin-react";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        AudioWorkletGlobalScope: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Register the plugin here
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React-specific rules
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: [
            "rotation-x",
            "rotation",         // Add this line
            "receiveShadow",
            "args",
            "object",
            "position",
            "intensity",
            "castShadow",
          ],
        },
      ],
      "react/no-unused-prop-types": "warn",
      "react/no-array-index-key": "warn",

      // General rules
      "no-console": "off",
    },
  },
];
