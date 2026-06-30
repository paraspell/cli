---
to: package.json
---
{
  "name": "<%= projectName %>",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "<%= axios %>",
    "polkadot-api": "<%= polkadotApi %>"<% if (evmWallet) { %>,
    "mipd": "<%= mipd %>",
    "viem": "<%= viem %>"<% } %>,
    "vue": "<%= vue %>"
  },
  "devDependencies": {
    "@eslint/js": "<%= eslintJs %>",
    "@vitejs/plugin-vue": "<%= vitejsPluginVue %>",
    "eslint": "<%= eslint %>",
    "eslint-plugin-vue": "<%= eslintPluginVue %>",
    "globals": "<%= globals %>",
    "typescript": "<%= typescript %>",
    "typescript-eslint": "<%= typescriptEslint %>",
    "vite": "<%= vite %>",
    "vue-eslint-parser": "<%= vueEslintParser %>",
    "vue-tsc": "<%= vueTsc %>"
  }
}
