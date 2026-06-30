---
to: README.md
---
# ParaSpell XCM API — Node.js example

Headless example: build transfers via the [XCM API](https://github.com/paraspell/xcm-tools/tree/main/apps/xcm-api), then sign with **Polkadot API** (substrate)<% if (evmWallet) { %> or **viem** (EVM origins)<% } %>.

By default it calls the public ParaSpell API at `https://api.paraspell.xyz/v1` (see `src/consts.ts`). For production, consider [deploying your own API](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html).

## Environment

Add your wallet secrets to `.env`:

| Variable | Used for |
|----------|----------|
| `SUBSTRATE_MNEMONIC` | Substrate routes: mnemonic or `//Dev` URI (mnemonics: `"word1 word2 ..."`) |<% if (evmWallet) { %>
| `PRIVATE_KEY` | EVM routes: `0x`-prefixed hex for viem |<% } %>
| `PORT` | Optional. HTTP port (default `3000`) |

## Usage

```bash
<%= installCmd %>
<%= startCmd %>
curl -X POST http://localhost:3000/
```

The server starts without submitting a transfer. Send `POST /` to sign and submit the configured XCM transfer (replace `3000` with your `PORT` if you set one).

> **Heads up:** the generated example signs and broadcasts a **live** XCM transfer on `POST /`. Use a dev/throwaway account while testing. Keep wallet secrets in `.env` (gitignored) — never on the command line or in version control.

## Features

| Feature | Behavior |
|---------|----------|
| Base | `POST /x-transfers` + PAPI `signSubmitAndWatch` |<% if (swap) { %>
| Swap | `swapOptions` on API request |<% } %><% if (evmWallet) { %>
| EVM | `POST /evm-x-transfer` + viem `sendTransaction` |<% } %><% if (snowbridge) { %>
| Snowbridge | `Ethereum` origins via API |<% } %>

## Docs

- [Getting started](https://paraspell.github.io/docs/xcm-api/getting-started.html)
- [Deploy the API yourself](https://paraspell.github.io/docs/xcm-api/deploy-api-yourself.html)

## License

MIT — see [LICENSE](LICENSE).
