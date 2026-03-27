// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

// Helper to sanitize globals with trailing spaces (e.g., AudioWorkletGlobalScope in some versions)
const sanitizeGlobals = (/** @type {Record<string, any>} */ globalsObj) => {
  return Object.keys(globalsObj).reduce((/** @type {Record<string, any>} */ acc, key) => {
    acc[key.trim()] = globalsObj[key];
    return acc;
  }, {});
};

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    // Global rule: Let TypeScript handle undefined variables and add browser globals
    files: ['**/*.ts', '**/*.tsx', '**/*.vue', '**/*.js'],
    languageOptions: {
      globals: {
        ...sanitizeGlobals((/** @type {any} */ (globals)).browser),
        ...sanitizeGlobals((/** @type {any} */ (globals)).node),
      },
    },
    rules: {
      'no-undef': 'off',
      // 'vue/multi-word-component-names': 'off',
      // 'vue/require-explicit-emits': 'off',
      // '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      '**/coverage/**', 
      '**/dist/**', 
      '**/node_modules/**',
      '**/dist-pkg/**'
    ],
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser, // Use TS parser for <script> blocks
        sourceType: 'module',
      },
    },
  },
  {
    // Specifically allow CommonJS in config files where it's often necessary
    files: ['**/*.config.js'],
    languageOptions: {
      globals: { ...sanitizeGlobals((/** @type {any} */ (globals)).node) },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Test environment
    files: ['**/tests/unit/**/*.test.js'],
    languageOptions: {
      globals: { 
        ...sanitizeGlobals((/** @type {any} */ (globals)).jest),
        ...sanitizeGlobals((/** @type {any} */ (globals)).node) // for setTimeout, etc.
      },
    }
  }
);
