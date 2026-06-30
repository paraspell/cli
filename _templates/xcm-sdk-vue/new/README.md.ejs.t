---
to: README.md
---
# ParaSpell XCM SDK🪄 starter template

Cross-chain transfer demo using the [XCM SDK](https://github.com/paraspell/xcm-tools/tree/main/packages/sdk) with **<%= clientLabel %>**.
See the [XCM SDK docs](https://paraspell.github.io/docs/xcm-sdk/send-xcm.html) to customize routes and assets.

## Prerequisites

- A browser wallet extension to sign transactions:
  - **Substrate:** [Polkadot.js](https://polkadot.js.org/extension/), [Talisman](https://talisman.xyz/), or [SubWallet](https://www.subwallet.app/).<% if (evmWallet) { %>
  - **EVM:** an EIP-1193 wallet such as [MetaMask](https://metamask.io/) (for EVM-origin transfers).<% } %>
- A funded account on the origin chain. This app submits **live** transfers — use a small amount and a test/throwaway account.

## Usage

1. Install dependencies: `<%= installCmd %>`
2. Start the dev server: `<%= devCmd %>` (Vite prints the local URL, usually `http://localhost:5173`)
3. **Connect a wallet** — click *Connect Wallet*, authorize the dApp in your extension, and pick an account.
4. Choose the origin and destination chains, currency, amount, and recipient, then **Submit** and approve the transaction in your wallet.
<% if (evmWallet) { %>
**EVM** is enabled — use the wallet selector to switch between a Substrate wallet and an EVM wallet (e.g. MetaMask) depending on the origin chain.<% } %><% if (swap) { %>
**Swap** is enabled — toggle *Add Swap* to also convert to a different currency on the destination via an exchange chain.<% } %><% if (snowbridge) { %>
**Snowbridge** is enabled — `Ethereum` origins route across the bridge.<% } %>

## Scripts

| Command | Description |
|---------|-------------|
| `<%= devCmd %>` | Start the Vite dev server |
| `<%= packageManager %> run build` | Production build |
| `<%= packageManager %> run preview` | Preview the production build locally |
| `<%= packageManager %> run lint` | Lint the project |

## Get Support

- Contact form on our [landing page](https://paraspell.xyz/#contact-us).
- Message us on [X](https://x.com/paraspell).
- Support channel on [Telegram](https://t.me/paraspell).

## License

MIT — see [LICENSE](LICENSE).
