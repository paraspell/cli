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
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "<%= sdkPackage %>": "<%= sdkVersion %>"<% if (swap) { %>,
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
    "@types/react": "<%= typesReact %>",
    "@types/react-dom": "<%= typesReactDom %>",
    "@vitejs/plugin-react": "<%= vitejsPluginReact %>",
    "eslint": "<%= eslint %>",
    "eslint-plugin-react-hooks": "<%= eslintPluginReactHooks %>",
    "eslint-plugin-react-refresh": "<%= eslintPluginReactRefresh %>",
    "globals": "<%= globals %>",
    "react": "<%= react %>",
    "react-dom": "<%= reactDom %>",
    "typescript": "<%= typescript %>",
    "typescript-eslint": "<%= typescriptEslint %>",
    "vite": "<%= vite %>",
    "vite-plugin-wasm": "<%= vitePluginWasm %>"
  }
}
