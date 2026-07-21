import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const globalSetup = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.join(cliRoot, "node_modules/tsx/dist/cli.mjs"),
        "src/generate-examples.ts",
      ],
      {
        cwd: cliRoot,
        stdio: "inherit",
        env: process.env,
      },
    );

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`generate-examples.ts exited with code ${code ?? "unknown"}`),
      );
    });
    child.on("error", reject);
  });
}

export default globalSetup;
