import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writeNodeEnv } from '../shared/write-node-env.js';
import { createTemplateContext } from './context.js';
import { formatGeneratedFile } from './format-generated-file.js';
import { createTemplateFiles } from './templates/index.js';
import type { TGenerateAppParams } from './types.js';

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

export const generateApp = async (
  params: TGenerateAppParams,
): Promise<void> => {
  const { opts } = params;
  const context = createTemplateContext(params);
  const templates = createTemplateFiles(context);

  await rm(opts.out, { recursive: true, force: true });
  await mkdir(opts.out, { recursive: true });

  const generatedFiles = await Promise.all(
    templates.map(async (template) => ({
      destination: resolveOutputPath(opts.out, template.path),
      source: await formatGeneratedFile(template.path, template.render()),
    })),
  );

  await Promise.all(
    generatedFiles.map(async ({ destination, source }) => {
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, source, 'utf8');
    }),
  );

  if (opts.framework === 'node') {
    await writeNodeEnv(opts.out, {
      evmWallet: context.evmWallet,
      privateKey: opts.privateKey,
      substrateMnemonic: opts.substrateMnemonic,
    });
  } else {
    await cp(
      new URL('../../assets/', import.meta.url),
      path.join(opts.out, 'public'),
      { recursive: true },
    );
  }
};
