# Security Policy

## Reporting a vulnerability

Please report security issues **privately** rather than opening a public issue:

- Use the contact form at <https://paraspell.xyz/#contact-us>, or
- Reach the team on [Telegram](https://t.me/paraspell) or [X](https://x.com/paraspell).

We'll acknowledge your report and work with you on a fix and coordinated disclosure.

## How `create-paraspell` handles secrets

`create-paraspell` can collect wallet secrets to pre-fill a generated **Node.js** project:

- For a Node.js app it may prompt (optionally) for a **Substrate mnemonic**, and — when EVM is
  enabled — an **EVM private key**. Both prompts mask input and can be skipped (press Enter).
- Entered secrets are written **only** to the generated project's `.env` file, which is:
  - listed in that project's `.gitignore` (so it is never committed), and
  - created with `0600` (owner read/write only) permissions.
- Secrets are **never** printed to the console or written to logs.
- You may also pass `--substrate-mnemonic` / `--private-key` for non-interactive runs, but avoid
  this on shared machines or in CI logs (shell history / log capture). Prefer the masked prompt or
  editing `.env` directly.

## Generated apps broadcast live transactions

Generated **Node.js** apps are Express servers that **sign and broadcast real XCM transfers** when
you `POST /`. Generated **web** apps submit real transfers once you connect a wallet and confirm.
Use a **dev / throwaway account** (e.g. `//Alice`) and small amounts while testing.

## Scope

This policy covers the `create-paraspell` CLI and the project templates it ships. Vulnerabilities in
the underlying ParaSpell SDK / API belong in the
[xcm-tools](https://github.com/paraspell/xcm-tools) repository.
