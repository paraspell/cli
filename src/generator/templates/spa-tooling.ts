import type { TTemplateContext, TTemplateFile } from '../types.js';
import { source } from './source.js';

const renderReactMain = () => source`import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element #root not found.");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  `;

const renderVueMain = () => source`import { createApp } from "vue";
  import App from "./App.vue";
  import "./index.css";

  createApp(App).mount("#app");
  `;

export const createSpaToolingTemplates = (
  context: TTemplateContext,
): readonly TTemplateFile[] => {
  const isReact = context.framework === 'react';
  const usesWasm = context.projectKind === 'sdk';
  const plugin = isReact ? 'react' : 'vue';

  return [
    {
      path: isReact ? 'src/main.tsx' : 'src/main.ts',
      render: isReact ? renderReactMain : renderVueMain,
    },
    {
      path: 'tsconfig.app.json',
      render: () =>
        isReact
          ? source`{
            "compilerOptions": {
              "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
              "target": "ES2023",
              "lib": ["ES2023", "DOM", "DOM.Iterable"],
              "module": "ESNext",
              "types": ["vite/client"],
              "allowArbitraryExtensions": true,
              "skipLibCheck": true,

              "moduleResolution": "bundler",
              "allowImportingTsExtensions": true,
              "verbatimModuleSyntax": true,
              "moduleDetection": "force",
              "noEmit": true,
              "jsx": "react-jsx",

              "strict": true,
              "noUnusedLocals": true,
              "noUnusedParameters": true,
              "erasableSyntaxOnly": true,
              "noFallthroughCasesInSwitch": true
            },
            "include": ["src"]
          }
          `
          : source`{
            "extends": "@vue/tsconfig/tsconfig.dom.json",
            "compilerOptions": {
              "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
              "types": ["vite/client"],
              "allowArbitraryExtensions": true,

              "strict": true,
              "noUnusedLocals": true,
              "noUnusedParameters": true,
              "erasableSyntaxOnly": true,
              "noFallthroughCasesInSwitch": true
            },
            "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
          }
          `,
    },
    {
      path: 'tsconfig.json',
      render: () => source`{
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ]
      }
      `,
    },
    {
      path: 'tsconfig.node.json',
      render: () => source`{
        "compilerOptions": {
          "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
          "target": "ES2023",
          "lib": ["ES2023"],
          "types": ["node"],
          "skipLibCheck": true,

          "module": "ESNext",
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,

          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "erasableSyntaxOnly": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["vite.config.ts"]
      }
      `,
    },
    {
      path: 'vite.config.ts',
      render: () => source`import { defineConfig } from "vite";
        import ${plugin} from "@vitejs/plugin-${plugin}";
        ${usesWasm ? source`import wasm from "vite-plugin-wasm";` : ''}

        export default defineConfig({
          plugins: [${plugin}()${usesWasm ? ', wasm()' : ''}],
        });
        `,
    },
  ];
};
