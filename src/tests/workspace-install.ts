import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCommand } from "./run-project.js";

export const WORKSPACE_INSTALL_TIMEOUT_MS = 20 * 60 * 1000;

const cliRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const getGeneratedRoot = (): string => {
  return path.join(cliRoot, "generated");
};

const GENERATED_WORKSPACE_PACKAGE = {
  name: "paraspell-generated-workspace",
  private: true,
} as const;

const GENERATED_WORKSPACE_CONFIG = `packages:
  - 'xcm-sdk/*/*'
  - 'xcm-api/*/*'

# polkadot-api (papi) and @polkadot/api (snowbridge) pull incompatible
# json-rpc-provider versions without this workspace-wide override.
overrides:
  '@polkadot-api/json-rpc-provider': 0.2.0

onlyBuiltDependencies:
  - bufferutil
  - es5-ext
  - esbuild
  - utf-8-validate
`;

const writeGeneratedWorkspace = (): void => {
  const root = getGeneratedRoot();
  fs.mkdirSync(root, { recursive: true });

  fs.writeFileSync(
    path.join(root, "pnpm-workspace.yaml"),
    GENERATED_WORKSPACE_CONFIG,
  );

  fs.writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify(GENERATED_WORKSPACE_PACKAGE, null, 2)}\n`,
  );
};

export const isInGeneratedWorkspace = (projectDir: string): boolean => {
  const generatedRoot = getGeneratedRoot();
  return (
    projectDir.startsWith(`${generatedRoot}${path.sep}`) &&
    fs.existsSync(path.join(generatedRoot, "pnpm-workspace.yaml"))
  );
};

export const hasProjectDependencies = (projectDir: string): boolean => {
  return fs.existsSync(path.join(projectDir, "node_modules"));
};

let installPromise: Promise<void> | undefined;

export const ensureGeneratedWorkspaceInstall = (
  timeoutMs = WORKSPACE_INSTALL_TIMEOUT_MS,
) => {
  if (!installPromise) {
    installPromise = (async () => {
      writeGeneratedWorkspace();
      const result = await runCommand(
        getGeneratedRoot(),
        "pnpm",
        ["install", "--no-frozen-lockfile"],
        timeoutMs,
      );
      if (!result.ok) {
        installPromise = undefined;
        throw new Error(`workspace install failed:\n${result.output}`);
      }
    })();
  }

  return installPromise;
};
