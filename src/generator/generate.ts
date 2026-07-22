import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeNodeEnv } from "../shared/write-node-env.js";
import { createTemplateContext } from "./context.js";
import { formatGeneratedFile } from "./format-generated-file.js";
import { API_FRAMEWORKS, SDK_FRAMEWORKS } from "./frameworks.js";
import { createTemplateFiles } from "./templates/index.js";
import type { FrameworkMeta, GenerateAppParams } from "./types.js";

const resolveOutputPath = (
  outputRoot: string,
  relativePath: string,
): string => {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`Generated path must be relative: ${relativePath}`);
  }

  const resolvedRoot = path.resolve(outputRoot);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  if (
    resolvedPath === resolvedRoot ||
    !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(
      `Generated path escapes the output directory: ${relativePath}`,
    );
  }
  return resolvedPath;
};

const copyLogo = async (
  meta: FrameworkMeta,
  outputRoot: string,
): Promise<void> => {
  if (!meta.logoFile) return;

  const logoSource = fileURLToPath(
    new URL(`../../assets/${meta.logoFile}`, import.meta.url),
  );
  if (!fs.existsSync(logoSource)) {
    throw new Error(`Missing generator asset: ${logoSource}`);
  }

  const logoDestination = path.join(outputRoot, "public", meta.logoFile);
  await fs.promises.mkdir(path.dirname(logoDestination), { recursive: true });
  await fs.promises.copyFile(logoSource, logoDestination);
};

export const generateApp = async (
  params: GenerateAppParams,
): Promise<void> => {
  const { kind, opts } = params;
  const meta =
    kind === "sdk"
      ? SDK_FRAMEWORKS[opts.framework]
      : API_FRAMEWORKS[opts.framework];
  const context = createTemplateContext(params);
  const templates = createTemplateFiles(meta.templateSet, context).filter(
    (template) => !template.skip,
  );

  if (fs.existsSync(opts.out)) {
    await fs.promises.rm(opts.out, { recursive: true, force: true });
  }
  await fs.promises.mkdir(opts.out, { recursive: true });

  const generatedFiles = await Promise.all(
    templates.map(async (template) => ({
      destination: resolveOutputPath(opts.out, template.path),
      source: await formatGeneratedFile(template.path, template.render()),
    })),
  );

  await Promise.all(
    generatedFiles.map(async ({ destination, source }) => {
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.writeFile(destination, source, "utf8");
    }),
  );

  await copyLogo(meta, opts.out);

  if (opts.framework === "node") {
    await writeNodeEnv(opts.out, {
      evmWallet: opts.evm || opts.snowbridge,
      privateKey: opts.privateKey,
      substrateMnemonic: opts.substrateMnemonic,
    });
  }

  const label = kind === "sdk" ? "XCM SDK" : "XCM API";
  console.log(`\nGenerated ${meta.label} ${label} app at ${opts.out}`);
};
