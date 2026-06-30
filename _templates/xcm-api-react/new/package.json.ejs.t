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
    "axios": "<%= axios %>",
    "polkadot-api": "<%= polkadotApi %>"<% if (evmWallet) { %>,
    "mipd": "<%= mipd %>",
    "viem": "<%= viem %>"<% } %>
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
    "vite": "<%= vite %>"
  }
}
