import {
  buildChoiceParser,
  type CommandContext,
  type TypedFlagParameter,
  type TypedPositionalParameters,
} from '@stricli/core';
import {
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  type TFramework,
  type TPackageManager,
} from './project-options.js';

const parseFrameworkArg = buildChoiceParser(FRAMEWORKS);

export const frameworkPositional: TypedPositionalParameters<
  [TFramework?],
  CommandContext
> = {
  kind: 'tuple',
  parameters: [
    {
      brief: `Target framework (${FRAMEWORKS.join(' | ')})`,
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
  brief: `Package manager: ${PACKAGE_MANAGERS.join(' | ')}`,
  optional: true,
};
