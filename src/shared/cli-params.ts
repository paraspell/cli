import type {
  CommandContext,
  TypedFlagParameter,
  TypedPositionalParameters,
} from '@stricli/core';
import {
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  type TFramework,
  type TPackageManager,
} from './project-options.js';

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

export const frameworkPositional: TypedPositionalParameters<
  [TFramework?],
  CommandContext
> = {
  kind: 'tuple',
  parameters: [
    {
      brief: 'Target framework (react | vue | node)',
      parse: parseFrameworkArg,
      optional: true,
      placeholder: 'framework',
    },
  ],
};

export const packageManagerFlag: TypedFlagParameter<
  TPackageManager | undefined
> = {
  kind: 'enum',
  values: PACKAGE_MANAGERS,
  brief: 'Package manager: npm | yarn | pnpm | bun',
  optional: true,
};
