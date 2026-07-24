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

## Checks

```bash
pnpm compile     # check the CLI for TypeScript errors
pnpm lint        # run type-aware ESLint checks on src/
pnpm format:check # verify Prettier formatting in src/
pnpm build       # build the CLI into dist/
pnpm test        # run unit tests colocated with source files
pnpm test:e2e    # run end-to-end tests from e2e/
```

## Releasing

```bash
pnpm build
pnpm pack            # inspect the tarball contents
pnpm publish
```
