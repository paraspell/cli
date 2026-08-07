<h1 align="center">paraspell-cli ✨</h1>

<p align="center">
  <img width="400" alt="ParaSpell logo" src="https://github.com/paraspell/xcm-tools/assets/55763425/a65e3626-84cf-444b-ab77-9375508e5895">
</p>

<p align="center">
  Start a working XCM app in minutes, with the stack and capabilities you choose.
</p>

<p align="center">
  <a href="https://paraspell.xyz">Website</a> ·
  <a href="https://paraspell.github.io/docs/">Documentation</a> ·
  <a href="https://github.com/paraspell/xcm-tools">XCM Tools</a>
</p>

<p align="center">
  <a href="https://codecov.io/gh/paraspell/cli">
    <img src="https://codecov.io/gh/paraspell/cli/graph/badge.svg" alt="Codecov">
  </a>
</p>

## Get started

```bash
pnpm dlx paraspell-cli@latest
```

The wizard helps you choose what to build, shows you the final setup, creates
the project, and installs its dependencies. When it finishes:

```bash
cd my-xcm-app
pnpm dev
```

Use npm, Yarn, or Bun instead if that is what your project uses:

```bash
npx paraspell-cli@latest
yarn dlx paraspell-cli@latest
bunx paraspell-cli@latest
```

Requires Node.js 24 or newer.

## What can I build?

|             | XCM SDK                                | XCM API                            |
| ----------- | -------------------------------------- | ---------------------------------- |
| Best for    | Calling ParaSpell directly in your app | Keeping XCM logic outside your app |
| Integration | PAPI, Polkadot.js, or Dedot            | Package-less HTTP API              |
| Apps        | React, Vue, or Node.js                 | React, Vue, or Node.js             |

The generated app comes with a transfer flow already wired up. Add any of these
when you need them:

- **Swap** for cross-chain swaps
- **EVM** for EVM origin chains
- **Snowbridge** for transfers between Ethereum and Polkadot

React and Vue projects include a Vite app with wallet integration. Node.js
projects include a headless Express server and optional development wallet
setup.

## The wizard

The interactive flow asks only what matters for the project you selected:

1. Choose XCM SDK or XCM API.
2. Choose React, Vue, or Node.js.
3. Pick a Polkadot client when using the SDK.
4. Choose the Swap, EVM, and Snowbridge extensions you need.
5. Name the project and choose a package manager.
6. Optionally configure a development wallet for Node.js.
7. Review everything before files are written.

Project creation and dependency installation include live progress. If
installation fails, your generated project is kept and the CLI prints the
manual command to continue.

## Use it from scripts

Prefer explicit commands in CI or when you already know the setup you want:

```bash
# React app using the XCM SDK and PAPI
npx paraspell-cli@latest sdk react \
  --name my-xcm-app \
  --client papi \
  --package-manager pnpm

# Vue app using the XCM API with EVM origins and swaps
npx paraspell-cli@latest api vue \
  --name my-xcm-api \
  --extensions evm,swap \
  --package-manager npm

# Headless SDK server with swaps
npx paraspell-cli@latest sdk node \
  --name my-xcm-server \
  --client dedot \
  --extensions swap
```

Non-interactive environments use sensible defaults and leave dependency
installation as an explicit CI step.

```bash
paraspell-cli --help
paraspell-cli sdk --help
paraspell-cli api --help
```

## A note about wallet secrets

Node.js projects can write a Substrate mnemonic and EVM private key to the
generated `.env`. Wallet setup is optional, values are entered through masked
prompts, and `.env` is gitignored.

Use a development account such as `//Alice`. The generated Node.js server can
sign and submit live XCM transfers when you call `POST /`.

Avoid secret flags in shared shells or CI logs; command-line values may be saved
in shell history. Prefer the interactive prompt or edit `.env` yourself.

## Work on the CLI

```bash
pnpm install
pnpm build
pnpm start
```

Useful checks:

```bash
pnpm compile
pnpm lint
pnpm format:check
pnpm build
pnpm test
pnpm test --coverage
pnpm test:e2e
```

## Links

- [XCM SDK documentation](https://paraspell.github.io/docs/xcm-sdk/getting-started.html)
- [XCM API documentation](https://paraspell.github.io/docs/xcm-api/getting-started.html)
- [XCM Tools monorepo](https://github.com/paraspell/xcm-tools)
- [ParaSpell website](https://paraspell.xyz)

MIT licensed.
