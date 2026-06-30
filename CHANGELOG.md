# Changelog

All notable changes to `create-paraspell` are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## 1.0.0

Initial public release.

- Interactive and non-interactive (`--type` + flags) scaffolding for **XCM SDK** and **XCM API**
  starter apps.
- Frameworks: **React** (Vite), **Vue** (Vite), and **Node.js** (Express server).
- SDK clients: **Polkadot API** (`papi`), **Polkadot.js** (`pjs`), and **Dedot** (`dedot`).
- Optional feature extensions: **EVM**, **Swap**, and **Snowbridge** (Snowbridge requires EVM).
- Node.js apps optionally prompt for wallet secrets and write them to a gitignored `.env`
  (see [SECURITY.md](SECURITY.md)).
