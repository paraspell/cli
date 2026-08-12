<br /><br />

<div align="center">
  <h1 align="center">paraspell-cli</h1>
  <h4 align="center">Scaffold ParaSpell XCM SDK and XCM API starter apps.</h4>

  <p align="center">
    <a href="https://npmjs.com/package/paraspell-cli">
      <img alt="version" src="https://img.shields.io/npm/v/paraspell-cli?style=flat-square" />
    </a>
    <a href="https://npmjs.com/package/paraspell-cli">
      <img alt="downloads" src="https://img.shields.io/npm/dm/paraspell-cli?style=flat-square" />
    </a>
    <a href="https://github.com/paraspell/cli/actions">
      <img alt="build" src="https://github.com/paraspell/cli/actions/workflows/ci.yml/badge.svg" />
    </a>
    <a href="https://codecov.io/gh/paraspell/cli">
      <img alt="codecov" src="https://codecov.io/gh/paraspell/cli/graph/badge.svg" />
    </a>
  </p>

  <p>ParaSpell website <a href="https://paraspell.xyz">[here]</a></p>
  <p>XCM SDK documentation <a href="https://paraspell.github.io/docs/xcm-sdk/getting-started.html">[here]</a></p>
  <p>XCM API documentation <a href="https://paraspell.github.io/docs/xcm-api/getting-started.html">[here]</a></p>
  <p>XCM Tools monorepo <a href="https://github.com/paraspell/xcm-tools">[here]</a></p>
</div>

<br /><br />

## Usage

### Get started

```bash
pnpm dlx paraspell-cli@latest
```

The wizard collects your choices, previews the configuration, then creates the
project and installs its dependencies.

```bash
cd my-xcm-app
pnpm dev
```

Use npm, Yarn, or Bun if that's your package manager:

```bash
npx paraspell-cli@latest
yarn dlx paraspell-cli@latest
bunx paraspell-cli@latest
```

> [!NOTE]
> Requires Node.js 24 or newer.

### XCM SDK

Call ParaSpell directly from your app. Choose a Polkadot client — PAPI
(recommended), Polkadot.js, or Dedot — and generate a React, Vue, or Node.js
project.

### XCM API

A REST API that builds XCM transfers while you sign them locally, so XCM
logic stays out of your app. Generate a React, Vue, or Node.js project that
calls it.

### Extensions

Every generated app ships with a transfer flow already wired up. Add any of
these when you need them:

- **EVM** — use EVM chains as origins
- **Swap** — cross-chain swaps via `@paraspell/swap`
- **Snowbridge** — transfers between Ethereum and Polkadot

React and Vue projects generate a Vite app with wallet integration. Node.js
projects generate a headless Express server with an optional development
wallet.

### The wizard

1. Choose XCM SDK or XCM API.
2. Choose React, Vue, or Node.js.
3. Pick a Polkadot client for the SDK.
4. Choose the Swap, EVM, and Snowbridge extensions.
5. Name the project and choose a package manager.
6. Optionally configure a development wallet for Node.js.
7. Review the configuration before files are written.

Project creation and dependency installation report live progress. If
installation fails, the generated project is kept and the CLI prints the
command to finish manually.

### Scripting

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

Non-interactive environments use sensible defaults; dependency installation
stays an explicit CI step.

```bash
paraspell-cli --help
paraspell-cli sdk --help
paraspell-cli api --help
```

### Wallet secrets

Node.js projects can write a Substrate mnemonic and an EVM private key to the
generated `.env`. Wallet setup is optional, values are entered through masked
prompts, and `.env` is gitignored.

Use a development account such as `//Alice`. The generated Node.js server
signs and submits live XCM transfers on `POST /`.

> [!WARNING]
> Avoid secret flags in shared shells or CI logs — command-line values can be
> saved in shell history. Prefer the interactive prompt, or edit `.env`
> directly.

## Development

```bash
pnpm install
pnpm build
pnpm start
```

## Tests

- Run compilation using `pnpm compile`
- Run the linter using `pnpm lint`
- Check formatting using `pnpm format:check`
- Run the build using `pnpm build`
- Run unit tests using `pnpm test`
- Run unit tests with coverage using `pnpm test --coverage`
- Run end-to-end tests using `pnpm test:e2e`

## Get Support 🚑

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on our [X](https://x.com/paraspell).
- Support channel on [telegram](https://t.me/paraspell).

## License

Made with 💛 by [ParaSpell✨](https://paraspell.xyz/)

Published under [MIT License](LICENSE).
