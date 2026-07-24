import { FRAMEWORKS, PACKAGE_MANAGERS } from './types.js';

const choiceParser = <T extends string>(
  label: string,
  values: readonly T[],
): ((input: string) => T) => {
  return (input) => {
    const match = values.find((value) => value === input);
    if (match === undefined) {
      throw new Error(
        `Unknown ${label} "${input}". Expected one of: ${values.join(', ')}.`,
      );
    }
    return match;
  };
};

const parseFrameworkArg = choiceParser('framework', FRAMEWORKS);

export const frameworkPositional = {
  kind: 'tuple',
  parameters: [
    {
      brief: 'Target framework (react | vue | node)',
      parse: parseFrameworkArg,
      optional: true,
      placeholder: 'framework',
    },
  ],
} as const;

export const packageManagerFlag = {
  kind: 'enum',
  values: PACKAGE_MANAGERS,
  brief: 'Package manager: npm | yarn | pnpm | bun',
  optional: true,
} as const;
