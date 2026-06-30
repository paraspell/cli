---
to: README.md
---
# ParaSpell XCM SDK — Node.js example

Headless example using **<%= clientLabel %>** (`<%= sdkPackage %>`) with `signAndSubmit()`.

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

Default route: `<%= snowbridge ? 'Ethereum' : evm ? 'Moonbeam' : 'Astar' %>` → `Hydration` — edit `src/transfer.ts` to customize.

## Docs

- [Send XCM](https://paraspell.github.io/docs/xcm-sdk/send-xcm.html)
- [Getting started](https://paraspell.github.io/docs/xcm-sdk/getting-started.html)

## License

MIT — see [LICENSE](LICENSE).
