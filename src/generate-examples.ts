import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildApplication, buildCommand, run } from "@stricli/core";
import { getPackageRoot } from "./package-root.js";
import {
  frameworkPositional,
  packageManagerFlag,
} from "./shared/cli-params.js";
import { API_FRAMEWORKS, SDK_FRAMEWORKS } from "./shared/frameworks.js";
import { generateApiApp, generateSdkApp } from "./shared/hygen-runner.js";
import { normalizePackageManager } from "./shared/package-manager.js";
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

export const sdkExampleDir = (client: SdkClient, combo: FeatureFlags): string => {
  const suffix = featureSuffix(combo);
  return suffix ? `${client}-${suffix}` : client;
};

const cliRoot = getPackageRoot();
const templatesRoot = path.join(cliRoot, "_templates");

const generateExamples = async (
  kind: ProjectType | undefined,
  framework: Framework | undefined,
  packageManagerRaw: PackageManager | undefined,
): Promise<void> => {
  const packageManager = normalizePackageManager(packageManagerRaw);
  const frameworks: readonly Framework[] = framework ? [framework] : FRAMEWORKS;

  if (!kind || kind === "sdk") {
    for (const fw of frameworks) {
      const meta = SDK_FRAMEWORKS[fw];
      for (const client of SDK_CLIENTS) {
        for (const combo of FEATURE_COMBOS) {
          const name = sdkExampleDir(client, combo);
          await generateSdkApp({
            meta,
            templatesRoot,
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
      const meta = API_FRAMEWORKS[fw];
      for (const combo of FEATURE_COMBOS) {
        const name = apiExampleName(combo);
        await generateApiApp({
          meta,
          templatesRoot,
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
