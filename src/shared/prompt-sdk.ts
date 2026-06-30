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
import type { SdkGenerateOptions } from './types.js';
import { PACKAGE_MANAGERS } from './package-manager.js';
import { validateNameInput } from './validate.js';

type NameValidator = (name: string) => true | string | Promise<true | string>;

type PromptProvided = {
  framework?: boolean;
};

type PromptSdkOptions = {
  validateName?: NameValidator;
  argv?: string[];
  provided?: PromptProvided;
};

export async function promptSdkOptions(
  partial: Partial<SdkGenerateOptions>,
  options: PromptSdkOptions = {},
): Promise<
  Pick<
    SdkGenerateOptions,
    | 'name'
    | 'client'
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
    kind: 'sdk',
    defaultName: 'my-xcm-app',
  });

  const defaultName = 'my-xcm-app';

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

  const client = argvHasFlag(argv, 'client')
    ? (partial.client ?? 'pjs')
    : await select({
        message: 'Select the desired JS client type',
        choices: [
          new Separator(),
          { name: 'Polkadot API', value: 'papi' },
          { name: 'Polkadot JS', value: 'pjs' },
          { name: 'Dedot', value: 'dedot' },
        ],
        default: partial.client ?? 'pjs',
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
    client,
    ...featureFlags,
    packageManager,
    privateKey,
    substrateMnemonic,
  };
}

export function sdkNeedsInteractive(
  argv: string[],
  partial: Partial<SdkGenerateOptions>,
): boolean {
  if (!process.stdin.isTTY) return false;
  if (!argvHasFlag(argv, 'package-manager')) return true;
  if (!argvHasFlag(argv, 'client')) return true;
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
