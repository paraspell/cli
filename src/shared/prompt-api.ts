import { Separator, input, select } from '@inquirer/prompts';
import { applyFeatureFlags } from './feature-flags.js';
import {
  EVM_EXTENSION,
  promptFeatureExtensions,
  SNOWBRIDGE_EXTENSION,
  SWAP_EXTENSION,
} from './feature-extensions-checkbox.js';
import { logArgvResolvedPrompts } from './log-resolved-prompt.js';
import {
  argvHasAnyFeatureFlag,
  argvHasAcceptedName,
  argvHasFlag,
  argvNameRejected,
} from './parse-cli-args.js';
import { promptEvmPrivateKey } from './prompt-evm-private-key.js';
import { promptSubstrateMnemonic } from './prompt-substrate-mnemonic.js';
import type { ApiGenerateOptions } from './types.js';
import { PACKAGE_MANAGERS } from './package-manager.js';
import { validateNameInput } from './validate.js';

type NameValidator = (name: string) => true | string | Promise<true | string>;

type PromptProvided = {
  framework?: boolean;
};

type PromptApiOptions = {
  validateName?: NameValidator;
  argv?: string[];
  provided?: PromptProvided;
};

export async function promptApiOptions(
  partial: Partial<ApiGenerateOptions>,
  options: PromptApiOptions = {},
): Promise<
  Pick<
    ApiGenerateOptions,
    | 'name'
    | 'evm'
    | 'swap'
    | 'snowbridge'
    | 'packageManager'
    | 'privateKey'
    | 'substrateMnemonic'
  >
> {
  const argv = options.argv ?? [];

  logArgvResolvedPrompts({
    argv,
    partial,
    provided: options.provided,
    kind: 'api',
    defaultName: 'my-xcm-api-app',
  });

  const defaultName = 'my-xcm-api-app';

  if (argvNameRejected(argv, partial.name)) {
    const reason = validateNameInput(partial.name ?? '');
    if (reason !== true) {
      console.warn(`Warning: ignoring invalid --name. ${reason}`);
    }
  }

  const name = argvHasAcceptedName(argv, partial.name)
    ? (partial.name ?? defaultName)
    : await input({
        message: 'Enter the project name',
        default: defaultName,
        validate: options.validateName ?? validateNameInput,
      });

  const packageManager = argvHasFlag(argv, 'package-manager')
    ? (partial.packageManager ?? 'pnpm')
    : await select({
        message: 'Select the desired package manager',
        choices: [
          new Separator(),
          ...PACKAGE_MANAGERS.map((packageManager) => ({
            name: packageManager,
            value: packageManager,
          })),
        ],
        default: partial.packageManager ?? 'pnpm',
      });

  let featureFlags: ReturnType<typeof applyFeatureFlags>;
  if (argvHasAnyFeatureFlag(argv)) {
    featureFlags = applyFeatureFlags({
      evm: partial.evm ?? false,
      swap: partial.swap ?? false,
      snowbridge: partial.snowbridge ?? false,
    });
  } else {
    const additionalFeatures = await promptFeatureExtensions({
      evm: partial.evm,
      swap: partial.swap,
      snowbridge: partial.snowbridge,
    });
    featureFlags = applyFeatureFlags({
      evm: additionalFeatures.includes(EVM_EXTENSION),
      swap: additionalFeatures.includes(SWAP_EXTENSION),
      snowbridge: additionalFeatures.includes(SNOWBRIDGE_EXTENSION),
    });
  }

  const substrateMnemonic =
    partial.framework !== 'node'
      ? undefined
      : partial.substrateMnemonic !== undefined
        ? partial.substrateMnemonic
        : await promptSubstrateMnemonic();

  const privateKey =
    partial.framework !== 'node' || !featureFlags.evmWallet
      ? undefined
      : partial.privateKey !== undefined
        ? partial.privateKey
        : await promptEvmPrivateKey();

  return {
    name,
    ...featureFlags,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
}

export function apiNeedsInteractive(
  argv: string[],
  partial: Partial<ApiGenerateOptions>,
): boolean {
  if (!process.stdin.isTTY) return false;
  if (!argvHasFlag(argv, 'package-manager')) return true;
  if (!argvHasAnyFeatureFlag(argv)) return true;
  if (!argvHasAcceptedName(argv, partial.name)) return true;
  if (partial.framework === 'node' && partial.substrateMnemonic === undefined) {
    return true;
  }
  const featureFlags = applyFeatureFlags({
    evm: partial.evm ?? false,
    swap: partial.swap ?? false,
    snowbridge: partial.snowbridge ?? false,
  });
  if (
    partial.framework === 'node' &&
    featureFlags.evmWallet &&
    partial.privateKey === undefined
  ) {
    return true;
  }
  return false;
}
