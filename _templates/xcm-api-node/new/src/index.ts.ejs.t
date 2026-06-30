---
to: src/index.ts
---
import "dotenv/config";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import express from "express";
import { transferViaApi } from "./transfer.js";

await cryptoWaitReady();

const app = express();
app.use(express.json());

app.post("/", async (_req, res) => {
  try {
    const result = await transferViaApi();
    res.status(200).json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error || error instanceof ErrorEvent ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log("POST / to submit the configured XCM transfer.");
});
