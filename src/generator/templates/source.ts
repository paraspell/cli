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
): readonly string[] => {
  const indent = sourceIndent(strings);
  const stripIndent = (value: string): string =>
    indent ? value.replaceAll(`\n${indent}`, '\n') : value;
  return strings.map(stripIndent);
};

export const source = (
  strings: TemplateStringsArray,
  ...values: readonly string[]
): string =>
  stripTemplateIndent(strings).reduce(
    (result, literal, index) => result + literal + (values[index] ?? ''),
    '',
  );
