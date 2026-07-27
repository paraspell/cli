import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeNodeEnv } from '../shared/write-node-env.js';
import { GENERATOR_TARGETS } from './config.js';
import { createTemplateContext } from './context.js';
import { formatGeneratedFile } from './format-generated-file.js';
import { createTemplateFiles } from './templates/index.js';
import type { TGeneratorTarget, TGenerateAppParams } from './types.js';

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

const copyAssets = async (
  meta: TGeneratorTarget,
  outputRoot: string,
): Promise<void> => {
  await Promise.all(
    (meta.assetFiles ?? []).map(async (assetFile) => {
      const source = fileURLToPath(
        new URL(`../../assets/${assetFile}`, import.meta.url),
      );
      if (!fs.existsSync(source)) {
        throw new Error(`Missing generator asset: ${source}`);
      }

      const destination = path.join(outputRoot, 'public', assetFile);
      await fs.promises.mkdir(path.dirname(destination), { recursive: true });
      await fs.promises.copyFile(source, destination);
    }),
  );
};

export const generateApp = async (
  params: TGenerateAppParams,
): Promise<void> => {
  const { kind, opts } = params;
  const meta = GENERATOR_TARGETS[kind][opts.framework];
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
      await fs.promises.writeFile(destination, source, 'utf8');
    }),
  );

  await copyAssets(meta, opts.out);

  if (opts.framework === 'node') {
    await writeNodeEnv(opts.out, {
      evmWallet: opts.extensions.evm || opts.extensions.snowbridge,
      privateKey: opts.privateKey,
      substrateMnemonic: opts.substrateMnemonic,
    });
  }
};
