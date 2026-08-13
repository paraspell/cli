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

> [!NOTE]
> Requires Node.js 24 or newer.

### Quick start

```bash
pnpm dlx paraspell-cli@latest
```

Use npm, Yarn, or Bun instead if that's your package manager:

```bash
npx paraspell-cli@latest
yarn dlx paraspell-cli@latest
bunx paraspell-cli@latest
```

### Interactive mode

1. Choose XCM SDK or XCM API.
2. Choose React, Vue, or Node.js.
3. Pick a Polkadot client for the SDK: PAPI (recommended), Polkadot.js, or
   Dedot.
4. Choose the Swap, EVM, and Snowbridge extensions.
5. Name the project and choose a package manager.
6. Optionally configure a development wallet for Node.js.
7. Review the configuration before files are written.

> [!NOTE]
> Project creation and dependency installation report live progress. If
> installation fails, the generated project is kept and the CLI prints the
> command to finish it manually.

### What to choose 🧰

| Choice                        | Options               | Pick based on                                                                                                                                                                              |
| ------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tool                           | XCM SDK / XCM API      | XCM SDK calls ParaSpell directly from your app. XCM API builds transfers via REST while you sign them locally, keeping XCM logic out of your app.                                        |
| Extensions                     | EVM, Swap, Snowbridge  | **EVM** for EVM-chain origins, **Swap** for cross-chain swaps (`@paraspell/swap`), **Snowbridge** for Ethereum ↔ Polkadot transfers.                                                      |
| Wallet secrets (Node.js only)  | Configure / skip       | Configure a development wallet (e.g. `//Alice`) so the generated server can sign and submit live transfers on `POST /`; skip it to wire up signing yourself. Secrets are entered via masked prompts and written to a gitignored `.env`. |

> [!WARNING]
> Avoid typing secrets literally when passing them as flags in shared shells
> or CI logs: command-line values can be saved in shell history. Prefer the
> interactive prompt, or edit `.env` directly.

### Getting help

```bash
npx paraspell-cli@latest --help
npx paraspell-cli@latest sdk --help
npx paraspell-cli@latest api --help
```

> [!NOTE]
> These commands run the CLI once without installing it, so `paraspell-cli`
> alone won't work afterward. Install it globally with `npm i -g
> paraspell-cli` to call `paraspell-cli --help` directly.

Want to skip the prompts and generate a project in one command? See
[Commands](#commands) below.

### Commands

Every wizard step is also available as a flag. Pass everything a command
needs and the wizard is skipped entirely, or leave a value out and the CLI
only prompts for that one — handy for templates, CI pipelines, or repeated
scaffolding.

```bash
paraspell-cli sdk [framework] [flags]
paraspell-cli api [framework] [flags]
```

`framework` can also be passed positionally instead of via `--framework`.

### Flags

| Flag                    | Values                                               | Description                                                                  |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--name`                | string                                               | Project name                                                                 |
| `--framework`           | `react` \| `vue` \| `node`                           | Target framework (default `react`)                                           |
| `--client`              | `papi` \| `pjs` \| `dedot`                           | JS client, `sdk` command only (default `papi`)                               |
| `--extensions`          | comma-separated list of `evm`, `swap`, `snowbridge`  | Extensions to include                                                        |
| `--package-manager`     | `npm` \| `yarn` \| `pnpm` \| `bun`                   | Package manager used to install dependencies (default `pnpm`)                |
| `--out`                 | path                                                  | Output directory                                                             |
| `--private-key`         | string                                               | EVM wallet key for the Node.js server, when using EVM or Snowbridge origins  |
| `--substrate-mnemonic`  | string                                               | Substrate mnemonic or `//Dev` URI for the Node.js server                     |

### Examples

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

> [!NOTE]
> Non-interactive environments use sensible defaults for anything not passed
> as a flag. Dependency installation stays an explicit step, so it can be run
> separately in CI.

> [!WARNING]
> Avoid typing `--private-key` or `--substrate-mnemonic` literally in shared
> shells or CI logs: command-line values can end up in shell history. Pass
> them via an environment variable instead. Preferably through the
> interactive prompt, or edit the generated `.env` directly.

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
