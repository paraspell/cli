import { code, type Code } from 'ts-poet';

const SOURCE_INDENT = '        ';

const stripSourceIndent = (value: string): string =>
  value.replaceAll(`\n${SOURCE_INDENT}`, '\n');

const stripTemplateIndent = (
  strings: TemplateStringsArray,
): TemplateStringsArray => {
  const stripped = strings.map(
    stripSourceIndent,
  ) as unknown as TemplateStringsArray;
  Object.defineProperty(stripped, 'raw', {
    value: strings.raw.map(stripSourceIndent),
  });
  return stripped;
};

export const source = (
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
): Code => code(stripTemplateIndent(strings), ...values);
