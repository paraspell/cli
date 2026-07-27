import { code, type Code } from 'ts-poet';

const sourceIndent = (strings: TemplateStringsArray): string => {
  const indentation = strings.flatMap((value) =>
    value
      .split('\n')
      .slice(1)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.match(/^[\t ]+/)?.[0])
      .filter((value): value is string => value !== undefined),
  );

  return indentation.reduce(
    (shortest, value) =>
      shortest === '' || value.length < shortest.length ? value : shortest,
    '',
  );
};

const stripTemplateIndent = (
  strings: TemplateStringsArray,
): TemplateStringsArray => {
  const indent = sourceIndent(strings);
  const stripIndent = (value: string): string =>
    indent ? value.replaceAll(`\n${indent}`, '\n') : value;
  const stripped = strings.map(stripIndent) as unknown as TemplateStringsArray;
  Object.defineProperty(stripped, 'raw', {
    value: strings.raw.map(stripIndent),
  });
  return stripped;
};

export const source = (
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
): Code => code(stripTemplateIndent(strings), ...values);
