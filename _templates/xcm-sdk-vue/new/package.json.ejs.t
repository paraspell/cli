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
    "<%= sdkPackage %>": "<%= sdkVersion %>",
    "vue": "<%= vue %>"<% if (swap) { %>,
    "@paraspell/swap": "<%= sdkVersion %>"<% } %><% if (evm) { %>,
    "@paraspell/evm": "<%= sdkVersion %>"<% } %><% if (evmWallet) { %>,
    "mipd": "<%= mipd %>",
    "viem": "<%= viem %>"<% } %><% if (snowbridge) { %>,
    "@paraspell/evm-snowbridge": "<%= sdkVersion %>"<% } %><% if (client === 'papi') { %>,
    "polkadot-api": "<%= polkadotApi %>"<% } %><% if (client === 'pjs') { %>,
    "@polkadot/api": "<%= polkadotJsApi %>",
    "@polkadot/extension-dapp": "<%= polkadotExtensionDapp %>"<% } %><% if (client === 'dedot') { %>,
    "dedot": "<%= dedot %>",
    "@polkadot/api": "<%= polkadotJsApi %>",
    "@polkadot/extension-dapp": "<%= polkadotExtensionDapp %>"<% } %>
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
    "vite-plugin-wasm": "<%= vitePluginWasm %>",
    "vue-eslint-parser": "<%= vueEslintParser %>",
    "vue-tsc": "<%= vueTsc %>"
  }
}
