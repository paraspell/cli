import path from "node:path";
import fs from "node:fs";
import ejs from "ejs";
import { runner, Logger } from "hygen";
import contextModule from "hygen/dist/context.js";
import { applyFeatureFlags } from "./feature-flags.js";
import { shouldWriteNodeEnv, writeNodeEnv } from "./write-node-env.js";
import type {
  ApiGenerateOptions,
  FrameworkMeta,
  ProjectType,
  SdkGenerateOptions,
} from "./types.js";
import type { RunnerConfig } from "hygen/dist/types.js";

const hygenContext = contextModule.default;

const createHygenHelpers = (): ((
  locals: Record<string, unknown>,
  config: Record<string, unknown>,
) => { includeShared: (relativePath: string) => string }) => {
  const helpers = (
    locals: Record<string, unknown>,
    config: Record<string, unknown>,
  ) => ({
    includeShared(relativePath: string): string {
      const templatesRoot = config.templates as string;
      const filePath = path.join(templatesRoot, relativePath);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing shared template: ${filePath}`);
      }
      const template = fs.readFileSync(filePath, "utf8");
      const ctx = hygenContext(
        { ...locals, templates: templatesRoot },
        { ...config, helpers },
      );
      return ejs.render(template, ctx);
    },
  });
  return helpers;
};

const runHygen = async (
  generator: string,
  templatesRoot: string,
  cwd: string,
  hygenArgs: string[],
): Promise<boolean> => {
  const result = await runner([generator, "new", ...hygenArgs], {
    templates: templatesRoot,
    cwd,
    createPrompter: () => ({ prompt: async () => ({}) }),
    logger: new Logger(console.log.bind(console)),
    debug: false,
    helpers: createHygenHelpers(),
  } as RunnerConfig);
  return result.success;
};

const copyLogo = async (
  meta: FrameworkMeta,
  templatesRoot: string,
  generator: string,
  outDir: string,
): Promise<void> => {
  const logoFile = meta.logoFile ?? "paraspell.png";
  const logoSrc = path.join(templatesRoot, generator, "new/public", logoFile);
  const logoDest = path.join(outDir, "public", logoFile);
  if (fs.existsSync(logoSrc)) {
    await fs.promises.mkdir(path.dirname(logoDest), { recursive: true });
    await fs.promises.copyFile(logoSrc, logoDest);
  }
};

const generateApp = async (params: {
  kind: ProjectType;
  meta: FrameworkMeta;
  templatesRoot: string;
  opts: SdkGenerateOptions | ApiGenerateOptions;
}): Promise<void> => {
  const { kind, meta, templatesRoot, opts } = params;
  const flags = applyFeatureFlags(opts);
  const templateDir = path.join(templatesRoot, meta.generator, "new");
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Missing Hygen templates at ${templateDir}`);
  }

  if (fs.existsSync(flags.out)) {
    await fs.promises.rm(flags.out, { recursive: true, force: true });
  }
  await fs.promises.mkdir(flags.out, { recursive: true });

  const hygenArgs = [
    `--name=${flags.name}`,
    ...(kind === "sdk"
      ? [`--client=${(flags as SdkGenerateOptions).client}`]
      : []),
    `--evm=${flags.evm}`,
    `--swap=${flags.swap}`,
    `--snowbridge=${flags.snowbridge}`,
    `--packageManager=${opts.packageManager}`,
  ];

  const ok = await runHygen(
    meta.generator,
    templatesRoot,
    flags.out,
    hygenArgs,
  );

  if (!ok) {
    throw new Error("Hygen generation failed");
  }

  await copyLogo(meta, templatesRoot, meta.generator, flags.out);

  if (shouldWriteNodeEnv(opts.framework)) {
    await writeNodeEnv(flags.out, {
      evmWallet: flags.evmWallet,
      privateKey: opts.privateKey,
      substrateMnemonic: opts.substrateMnemonic,
    });
  }

  const label = kind === "sdk" ? "XCM SDK" : "XCM API";
  console.log(`\nGenerated ${meta.label} ${label} app at ${flags.out}`);
};

export const generateSdkApp = async (params: {
  meta: FrameworkMeta;
  templatesRoot: string;
  opts: SdkGenerateOptions;
}) => {
  return generateApp({
    kind: "sdk",
    meta: params.meta,
    templatesRoot: params.templatesRoot,
    opts: params.opts,
  });
};

export const generateApiApp = async (params: {
  meta: FrameworkMeta;
  templatesRoot: string;
  opts: ApiGenerateOptions;
}): Promise<void> => {
  return generateApp({
    kind: "api",
    meta: params.meta,
    templatesRoot: params.templatesRoot,
    opts: params.opts,
  });
};
