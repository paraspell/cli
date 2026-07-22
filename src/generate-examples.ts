import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildApplication, buildCommand, run } from "@stricli/core";
import {
  frameworkPositional,
  packageManagerFlag,
} from "./shared/cli-params.js";
import { generateApp } from "./generator/generate.js";
import {
  FEATURE_KEYS,
  FRAMEWORKS,
  SDK_CLIENTS,
  type FeatureFlags,
  type Framework,
  type PackageManager,
  type ProjectType,
  type SdkClient,
} from "./shared/types.js";

export const FEATURE_COMBOS: readonly FeatureFlags[] = [false, true].flatMap(
  (evm) =>
    [false, true].flatMap((snowbridge) =>
      [false, true].map((swap) => ({ evm, swap, snowbridge })),
    ),
);

export const featureSuffix = (combo: FeatureFlags): string => {
  return FEATURE_KEYS.filter((key) => combo[key]).join("-");
};

export const apiExampleName = (combo: FeatureFlags): string => {
  return featureSuffix(combo) || "base";
};

export const sdkExampleDir = (
  client: SdkClient,
  combo: FeatureFlags,
): string => {
  const suffix = featureSuffix(combo);
  return suffix ? `${client}-${suffix}` : client;
};

const cliRoot = fileURLToPath(new URL("../", import.meta.url));
const generateExamples = async (
  kind: ProjectType | undefined,
  framework: Framework | undefined,
  packageManager: PackageManager = "pnpm",
): Promise<void> => {
  const frameworks: readonly Framework[] = framework ? [framework] : FRAMEWORKS;

  if (!kind || kind === "sdk") {
    for (const fw of frameworks) {
      for (const client of SDK_CLIENTS) {
        for (const combo of FEATURE_COMBOS) {
          const name = sdkExampleDir(client, combo);
          await generateApp({
            kind: "sdk",
            opts: {
              framework: fw,
              name,
              client,
              evm: combo.evm,
              swap: combo.swap,
              snowbridge: combo.snowbridge,
              packageManager,
              out: path.join(cliRoot, "generated", "xcm-sdk", fw, name),
            },
          });
        }
      }
    }
  }

  if (!kind || kind === "api") {
    for (const fw of frameworks) {
      for (const combo of FEATURE_COMBOS) {
        const name = apiExampleName(combo);
        await generateApp({
          kind: "api",
          opts: {
            framework: fw,
            name: `xcm-api-${name}`,
            out: path.join(cliRoot, "generated", "xcm-api", fw, name),
            evm: combo.evm,
            swap: combo.swap,
            snowbridge: combo.snowbridge,
            packageManager,
          },
        });
      }
    }
  }
};

const command = buildCommand<
  { packageManager?: PackageManager; kind?: ProjectType },
  [Framework?]
>({
  docs: { brief: "Generate ParaSpell XCM SDK and API example apps" },
  parameters: {
    positional: frameworkPositional,
    flags: {
      packageManager: packageManagerFlag,
      kind: {
        kind: "enum",
        values: ["sdk", "api"],
        brief: "Which examples to generate (defaults to both)",
        optional: true,
      },
    },
  },
  func: async (flags, framework) => {
    try {
      await generateExamples(flags.kind, framework, flags.packageManager);
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  },
});

const app = buildApplication(command, {
  name: "generate-examples",
  scanner: { caseStyle: "allow-kebab-for-camel" },
});

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await run(app, process.argv.slice(2), { process });
}
