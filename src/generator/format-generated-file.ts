import path from 'node:path';
import { parse as parseVue } from '@vue/compiler-sfc';
import { format, getFileInfo } from 'prettier';
import type { Code } from 'ts-poet';

const validateVue = (relativePath: string, source: string): void => {
  const { errors } = parseVue(source, { filename: relativePath });
  if (errors.length > 0) {
    const details = errors
      .map((error) => (typeof error === 'string' ? error : error.message))
      .join('\n');
    throw new Error(
      `Invalid generated Vue SFC in ${relativePath}:\n${details}`,
    );
  }
};

export const formatGeneratedFile = async (
  relativePath: string,
  sourceCode: Code,
): Promise<string> => {
  const extension = path.extname(relativePath);
  const { inferredParser: parser } = await getFileInfo(relativePath, {
    ignorePath: [],
  });
  const source = sourceCode
    .toString({ format: false, path: relativePath })
    .replace(/^\n/, '');
  if (!parser) return source;

  let formatted: string;
  try {
    formatted = await format(source, { filepath: relativePath, parser });
  } catch (error) {
    throw new Error(`Unable to format generated file ${relativePath}`, {
      cause: error,
    });
  }

  if (extension === '.vue') {
    validateVue(relativePath, formatted);
  }

  return formatted;
};
