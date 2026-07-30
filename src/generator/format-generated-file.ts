import { parse as parseVue } from '@vue/compiler-sfc';
import { format, getFileInfo } from 'prettier';

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
  sourceCode: string,
): Promise<string> => {
  const { inferredParser: parser } = await getFileInfo(relativePath, {
    ignorePath: [],
  });
  const source = sourceCode.replace(/^\n/, '');
  if (!parser) return source;

  let formatted: string;
  try {
    formatted = await format(source, { filepath: relativePath, parser });
  } catch (error) {
    throw new Error(`Unable to format generated file ${relativePath}`, {
      cause: error,
    });
  }

  if (parser === 'vue') {
    validateVue(relativePath, formatted);
  }

  return formatted;
};
