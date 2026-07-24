# Contributing

Thanks for helping improve `create-paraspell`!

## Prerequisites

- Node.js `>=24`
- A package manager (the repo uses pnpm by default; npm works too)

## Setup

```bash
pnpm install
pnpm build       # build the CLI into dist/
pnpm start       # run the built CLI locally
```

## Project layout

- `src/` — the TypeScript CLI (entry `src/index.ts`, compiled to `dist/`)
- `src/generator/templates/` — typed scaffold definitions for every SDK/API framework
- `src/generator/` — synthesis context, formatting, validation, and output
- `assets/` — logos copied into generated browser projects

The "Repository development" section of the [README](README.md) has the full package layout.

## Editing scaffolds

Scaffolds are native TypeScript functions and use ordinary conditionals for `evm`,
`swap`, `snowbridge`, and `client`. Their substitutions and shared-fragment IDs are
checked by `tsc`. Pinned dependency versions are centralized in
`src/generator/versions.ts` (`SDK_VERSION`, `PACKAGE_VERSIONS`) — bump them there,
not per scaffold.

Generated TypeScript is composed through ts-poet, formatted by Prettier, and parsed
with ts-morph. Vue SFCs are additionally validated with `@vue/compiler-sfc`.

## Tests

```bash
pnpm build       # required before tests; emits dist/
pnpm compile     # check the CLI for TypeScript errors
pnpm test        # scaffold all variants + assert structure/deps (fast)
pnpm test:build  # install + build every generated variant (slow)
pnpm test:all    # structure + build
```

Please run `pnpm compile` and `pnpm test` before opening a PR. For scaffold changes,
`pnpm test:build` (or a targeted subset, e.g. `TEST_FRAMEWORK=react pnpm test:build`) is
recommended.

## Releasing

```bash
pnpm build
pnpm pack            # inspect the tarball contents
pnpm publish
```
