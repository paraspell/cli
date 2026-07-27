import type { Code } from 'ts-poet';
import type { TTemplateContext, TTemplateFile } from '../types.js';
import { createFragmentFile } from './fragment-file.js';
import { renderPackageJson } from './package-json.js';
import type { TFragmentRenderer } from './shared/fragment-types.js';
import { source } from './source.js';

const renderGitignore = (framework: TTemplateContext['framework']): Code =>
  framework === 'node'
    ? source`node_modules
      dist

      # Local secrets — never commit wallet credentials or RPC keys.
      .env
      .env.local
      .env.*.local

      *.log
      .DS_Store
      `
    : source`node_modules
      dist
      dist-ssr
      *.local

      # Local secrets. Vite exposes VITE_-prefixed values to the browser.
      .env
      .env.local
      .env.*.local

      *.log
      .vscode/*
      !.vscode/extensions.json
      .idea
      .DS_Store
      `;

const renderScripts = (context: TTemplateContext): Code => {
  const { framework, packageManager, startCmd } = context;

  return framework === 'node'
    ? source`| Command | Description |
      | --- | --- |
      | **${startCmd}** | Start the HTTP server |
      | **${packageManager} run build** | Compile TypeScript |
      | **${packageManager} run compile** | Check TypeScript types |
      | **${packageManager} run lint** | Lint the project |
      | **${packageManager} run format** | Format the project |
      `
    : source`| Command | Description |
      | --- | --- |
      | **${startCmd}** | Start the Vite development server |
      | **${packageManager} run build** | Create a production build |
      | **${packageManager} run compile** | Check TypeScript types |
      | **${packageManager} run lint** | Lint the project |
      | **${packageManager} run format** | Format the project |
      | **${packageManager} run preview** | Preview the production build |
      `;
};

const renderBrowserReadme = (context: TTemplateContext): Code => {
  const {
    projectKind,
    installCmd,
    startCmd,
    sdkPackage,
    clientLabel,
    evmWallet,
  } = context;
  const api = projectKind === 'api';

  return source`# ParaSpell XCM ${api ? 'API' : 'SDK'} starter

    ${
      api
        ? source`A browser example that requests XCM transactions from the [ParaSpell XCM API](https://paraspell.github.io/docs/xcm-api/getting-started.html) and signs them with a connected wallet.

    It uses the public API at https://api.paraspell.xyz/v1. For production workloads, consider [deploying the API](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html).
    `
        : source`A browser example built with **${clientLabel}** and [${sdkPackage}](https://paraspell.github.io/docs/xcm-sdk/getting-started.html).
    `
    }
    ## Prerequisites

    - A funded account on the origin chain. This app submits live transfers, so start with a small amount.
    - A Substrate browser wallet such as Polkadot.js, Talisman, or SubWallet.${
      evmWallet
        ? source`
    - An EIP-1193 wallet such as MetaMask for EVM-origin transfers.`
        : ''
    }

    ## Run locally

    1. Install dependencies with **${installCmd}**.
    2. Start the app with **${startCmd}**.
    3. Connect a wallet, configure the route, and submit the transfer.

    ## Scripts

    ${renderScripts(context)}
    ## Learn more

    - [ParaSpell documentation](https://paraspell.github.io/docs/)
    - [ParaSpell website](https://paraspell.xyz/)
    - [Support on Telegram](https://t.me/paraspell)

    ## License

    MIT — see [LICENSE](LICENSE).
    `;
};

const renderNodeReadme = (context: TTemplateContext): Code => {
  const {
    projectKind,
    installCmd,
    startCmd,
    sdkPackage,
    clientLabel,
    evmWallet,
  } = context;
  const api = projectKind === 'api';

  return source`# ParaSpell XCM ${api ? 'API' : 'SDK'} — Node.js example

    ${
      api
        ? source`A headless example that builds transfers with the [ParaSpell XCM API](https://paraspell.github.io/docs/xcm-api/getting-started.html) and signs them locally.

    It uses the public API at https://api.paraspell.xyz/v1. For production workloads, consider [deploying the API](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html).
    `
        : source`A headless example using **${clientLabel}** and **${sdkPackage}**.
    `
    }
    ## Environment

    Create a **.env** file:

    | Variable | Purpose |
    | --- | --- |
    | **SUBSTRATE_MNEMONIC** | Mnemonic or development URI used for Substrate origins |${
      evmWallet
        ? source`
    | **PRIVATE_KEY** | 0x-prefixed private key used for EVM origins |`
        : ''
    }
    | **PORT** | Optional HTTP port; defaults to 3000 |

    ## Run locally

    1. Install dependencies with **${installCmd}**.
    2. Start the server with **${startCmd}**.
    3. Trigger the configured example with **curl -X POST http://localhost:3000/**.

    The server starts without moving funds. Each **POST /** signs and broadcasts the configured live transfer. Use a development account and edit **src/transfer.ts** before submitting.

    ## Scripts

    ${renderScripts(context)}
    ## Learn more

    - [ParaSpell documentation](https://paraspell.github.io/docs/)
    - [ParaSpell website](https://paraspell.xyz/)

    ## License

    MIT — see [LICENSE](LICENSE).
    `;
};

export const createScaffoldTemplates = (
  context: TTemplateContext,
  renderFragment: TFragmentRenderer,
): readonly TTemplateFile[] => {
  const fragment = createFragmentFile(renderFragment);

  return [
    {
      path: '.gitignore',
      render: () => renderGitignore(context.framework),
    },
    fragment('LICENSE', 'LICENSE'),
    {
      path: 'README.md',
      render: () =>
        context.framework === 'node'
          ? renderNodeReadme(context)
          : renderBrowserReadme(context),
    },
    {
      path: 'package.json',
      render: () => renderPackageJson(context),
    },
    fragment('index.html', 'spa/index.html', context.framework === 'node'),
  ];
};
