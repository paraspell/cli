<h1 align="center">
create-paraspell ✨ — scaffold XCM starter apps
</h1>

<p align="center">
<img width="400" alt="ParaSpell logo" src="https://github.com/paraspell/xcm-tools/assets/55763425/a65e3626-84cf-444b-ab77-9375508e5895">
</p>

<p align="center">
  Official CLI to bootstrap <strong>XCM SDK</strong> and <strong>XCM API</strong> apps — React, Vue, or Node — in seconds.
</p>

<p align="center">
  <a href="https://paraspell.xyz">Website</a> ·
  <a href="https://paraspell.github.io/docs/">Documentation</a> ·
  <a href="https://github.com/paraspell/xcm-tools">XCM Tools monorepo</a>
</p>

<br>

**What you can generate:**

- **[XCM SDK](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk) 🪄** — Cross-chain dApps with an in-app client library.
  - **Clients:** `papi` ([Polkadot API](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk)), `pjs` ([Polkadot.js](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk-pjs)), `dedot` ([Dedot](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk-dedot))
  - **Extensions (optional):** [EVM](https://github.com/paraspell/xcm-tools/tree/main/packages/evm), [Swap](https://paraspell.github.io/docs/xcm-sdk/getting-started.html#install-swap-extension), [Snowbridge](https://github.com/paraspell/xcm-tools/tree/main/packages/evm-snowbridge)
- **[XCM API](https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api) ⚡️** — Package-less XCM integration: your app calls the API, signs locally, and stays lean.

**Frameworks** : React (Vite), Vue (Vite), or Node.js (headless Express server).

<br>

## Quick start

Run the CLI in any empty folder (interactive prompts guide you through type, framework, client, and features):

```bash
pnpm create paraspell
```

Then follow the printed next steps. For a **React / Vue** app:

```bash
cd my-app
pnpm install
pnpm run dev
```

For a **Node.js** app (a headless Express server):

```bash
cd my-app
pnpm install
pnpm start                          # boots the server — no transfer yet
curl -X POST http://localhost:3000/ # signs & submits the configured XCM transfer
```

<details><summary><b>Other package managers</b></summary>
<br>

| Tool | Command |
|------|---------|
| **npm** | `npm create paraspell@latest` |
| **yarn** | `yarn create paraspell` |
| **pnpm** | `pnpm create paraspell` |
| **bun** | `bun create paraspell` |
| **npx** | `npx create-paraspell@latest` |

**Global binary** (after `pnpm install -g create-paraspell`):

```bash
create-paraspell
```

</details>

<details><summary><b>Interactive mode (what it asks)</b></summary>
<br>

Running with no arguments prompts for, in order:

1. **Project name**
2. **Package manager** — `npm` / `yarn` / `pnpm` / `bun`
3. **Framework** — React / Vue / Node.js
4. **Project type** — XCM SDK or XCM API
5. **Client** (SDK only) — Polkadot API / Polkadot.js / Dedot
6. **Feature extensions** — EVM, Swap, Snowbridge (Snowbridge requires EVM)

For the **Node.js** framework it additionally (optionally) prompts for a **Substrate mnemonic**, and — when EVM is enabled — an **EVM private key**. These are written only to the generated project's `.env` (gitignored, `chmod 600`), never logged or committed. Press Enter to skip and add them to `.env` yourself later. See [Security](#security).

</details>

<details><summary><b>For Agents & CI</b></summary>
<br>

Use `sdk` or `api` as the first argument (or `--type`), plus `--name`. SDK projects also accept `--client` (defaults to `pjs`; on a TTY you're prompted for it if omitted).

```bash
npx create-paraspell@latest sdk react --name my-app --client pjs --package-manager pnpm
npx create-paraspell@latest api vue --name my-api --package-manager npm
npx create-paraspell@latest --type sdk --framework node --name my-node --client dedot --evm
```

```bash
create-paraspell --help
create-paraspell sdk --help
create-paraspell api --help
```

On a TTY, omitting `--name` or `--client` (SDK) opens prompts. Without a TTY, sensible defaults apply.

| Flag | Values | Default |
|------|--------|---------|
| `--type` | `sdk`, `api` | required when not using `sdk`/`api` subcommand |
| `--framework` | `react`, `vue`, `node` | `react` |
| `--client` (SDK only) | `papi`, `pjs`, `dedot` | `pjs` |
| `--evm`, `--swap`, `--snowbridge` | bare flag enables feature | `false` |
| `--package-manager` | `npm`, `yarn`, `pnpm`, `bun` | `pnpm` |
| `--name`, `--out` | | `./<name>` in the current directory |
| `--substrate-mnemonic` | (Node only) seed the generated `.env` | — |
| `--private-key` | (Node + EVM or Snowbridge) seed the generated `.env` | — |

> Avoid passing `--substrate-mnemonic` / `--private-key` on a shared shell or in CI logs — they can leak into shell history. Prefer the interactive masked prompt, or edit the generated `.env` directly. See [Security](#security).

</details>

## Security

This CLI can prompt for wallet secrets to pre-fill a generated **Node.js** app:

- A **Substrate mnemonic** (any Node.js app) and, with `--evm`, an **EVM private key**.
- Entered secrets are written **only** to the generated project's `.env` — gitignored and created with `chmod 600` — and are never logged or committed.
- The prompts are **optional** — press Enter to skip and add secrets to `.env` yourself later.
- Use a **dev / throwaway account** (e.g. `//Alice`) for testing: generated Node apps sign and broadcast **live** XCM transfers on `POST /`.

Found a vulnerability? See [SECURITY.md](SECURITY.md).

<details><summary><b>Repository development</b></summary>
<br>

Clone this repo and use the same flags via dev scripts. Output defaults to `generated/` unless you pass `--out`:

```bash
pnpm install
pnpm build
pnpm execute          # run the built CLI locally
pnpm generate         # interactive flow via tsx (source)

pnpm generate:sdk -- react --name my-app --client pjs --package-manager pnpm
pnpm generate:xcm-api -- vue --name my-api --package-manager npm
```

**Package layout:**

```text
├── index.js                  # starting point
├── dist/                     # built CLI
├── assets/                   # bundled static files
├── _templates/               # Hygen generators
│   ├── shared/               # shared EJS partials (evm, xcm)
│   ├── xcm-sdk-{react,vue,node}/
│   └── xcm-api-{react,vue,node}/
├── shared/                   # Hygen helpers consumed by templates (CommonJS)
│   ├── feature-flags.cjs
│   ├── package-manager.cjs
│   └── versions.cjs
└── src/                      # TypeScript CLI source
    ├── index.ts              # entry → dist/
    ├── run-cli.ts            # argv routing & agent flow
    ├── interactive.ts        # prompts & banner
    └── shared/               # hygen-runner, parsers, prompts, etc.
```

**Updating dependency versions**

To edit package versions see `shared/versions.cjs` (`SDK_VERSION`, `PACKAGE_VERSIONS`).
All scaffolded dependency versions — runtime and dev — are centralized there.

**Publish:**

```bash
pnpm run build
pnpm pack
pnpm publish --access public
```

</details>

<details><summary><b>Testing</b></summary>
<br>

```bash
pnpm typecheck          # type-check the CLI
pnpm test                   # scaffold variants + check structure
pnpm test:build         # production build each variant (slow)
pnpm test:all           # structure + build
pnpm test:watch         # structure tests in watch mode
pnpm test:generate      # regenerate generated/ only
SKIP_GENERATE=1 pnpm test   # skip scaffolding, reuse generated/
```

</details>
