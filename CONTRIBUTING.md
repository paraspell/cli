# Contributing

Thanks for helping improve `create-paraspell`!

## Prerequisites

- Node.js `>=24`
- A package manager (the repo uses pnpm by default; npm works too)

## Setup

```bash
pnpm install
pnpm build       # build the CLI into dist/
pnpm execute     # run the built CLI locally
pnpm generate    # interactive flow via tsx (source)
```

## Project layout

- `src/` — the TypeScript CLI (entry `src/index.ts`, bundled to `dist/`)
- `_templates/` — Hygen generators for the scaffolded apps
  (`{xcm-sdk,xcm-api}-{react,vue,node}/new/`)
- `shared/*.cjs` — helpers consumed by **both** the CLI and the templates
  (`feature-flags.cjs`, `package-manager.cjs`, `versions.cjs`)

The "Repository development" section of the [README](README.md) has the full package layout.

## Editing templates

Templates are EJS (`<% %>`) and use feature flags (`evm`, `swap`, `snowbridge`, `client`) for
conditional output. Pinned dependency versions are centralized in `shared/versions.cjs`
(`SDK_VERSION`, `PACKAGE_VERSIONS`) — bump them there, not per-template.

## Tests

```bash
pnpm typecheck   # type-check the CLI
pnpm test            # scaffold all variants + assert structure/deps (fast)
pnpm test:build  # install + build every generated variant (slow)
pnpm test:all    # structure + build
```

Please run `pnpm typecheck` and `pnpm test` before opening a PR. For template changes,
`pnpm test:build` (or a targeted subset, e.g. `TEST_FRAMEWORK=react pnpm test:build`) is
recommended.

## Releasing

```bash
pnpm build
pnpm pack            # inspect the tarball contents
pnpm publish
```

`prepublishOnly` rebuilds `dist/` automatically before publish.
