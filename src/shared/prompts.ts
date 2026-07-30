import path from 'node:path';
import {
  confirm,
  group,
  log,
  multiselect,
  note,
  password,
  select,
  text,
} from '@clack/prompts';
import type { TGenerateAppParams } from '../generator/types.js';
import { ask, toClackValidate } from './clack.js';
import {
  DEFAULT_FRAMEWORK,
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_PROJECT_TYPE,
  DEFAULT_SDK_CLIENT,
  EXTENSION_KEYS,
  EXTENSION_OPTIONS,
  FRAMEWORK_OPTIONS,
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  PROJECT_TYPE_OPTIONS,
  PROJECT_TYPES,
  SDK_CLIENT_OPTIONS,
  SDK_CLIENTS,
  type TExtensionKey,
  type TExtensions,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
  requiresEvmWallet,
  resolveExtensions,
} from './project-options.js';
import { applyGenerateDefaults } from './resolve-options.js';
import { type TResolveInput, type TResolvedOptions } from './types.js';
import {
  validateEvmPrivateKey,
  validateNameInput,
  validateSubstrateMnemonic,
} from './validate.js';

export type TNameValidator = (name: string) => true | string;

type TPromptGenerateOptions = {
  validateName?: TNameValidator;
};

const extensionsProvided = (input: TResolveInput): boolean =>
  EXTENSION_KEYS.some((extension) => input.extensions[extension] !== undefined);

const validateProvidedSecret = (
  value: string | undefined,
  flagName: string,
  validate: (value: string) => true | string,
): string | undefined => {
  if (value === undefined) return undefined;
  const result = validate(value);
  if (result === true) return value;
  log.warn(`Ignoring invalid ${flagName}. ${result}`);
  return undefined;
};

const enabledExtensions = (extensions: TExtensions): string =>
  EXTENSION_KEYS.filter((extension) => extensions[extension])
    .map((extension) => EXTENSION_OPTIONS[extension].label)
    .join(', ') || 'None';

const displayPath = (outDir: string): string => {
  const relative = path.relative(process.cwd(), outDir);
  const outsideCwd =
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative);
  return relative && !outsideCwd ? `.${path.sep}${relative}` : outDir;
};

export const reviewProject = async (
  params: TGenerateAppParams,
): Promise<boolean> => {
  const { kind, opts } = params;
  const lines = [
    `Project          ${PROJECT_TYPE_OPTIONS[kind].label}`,
    `Framework        ${FRAMEWORK_OPTIONS[opts.framework].label}`,
    kind === 'sdk'
      ? `Client           ${SDK_CLIENT_OPTIONS[opts.client].label}`
      : undefined,
    `Extensions       ${enabledExtensions(opts.extensions)}`,
    `Package manager  ${opts.packageManager}`,
    `Directory        ${displayPath(opts.out)}`,
    opts.framework === 'node'
      ? `Dev wallet       ${
          opts.substrateMnemonic || opts.privateKey
            ? 'configured in .env'
            : 'not configured'
        }`
      : undefined,
  ].filter((line): line is string => line !== undefined);

  note(lines.join('\n'), 'Project summary');
  return ask(
    confirm({
      message: 'Continue with this configuration?',
      active: 'Yes',
      inactive: 'No',
      initialValue: true,
      vertical: true,
    }),
  );
};

export const promptExtensions = async (
  defaults: Partial<TExtensions> = {},
): Promise<TExtensionKey[]> => {
  const initialValues = EXTENSION_KEYS.filter(
    (extension) => defaults[extension] === true,
  );

  return ask(
    multiselect<TExtensionKey>({
      message: 'Choose extensions',
      options: EXTENSION_KEYS.map((value) => ({
        value,
        ...EXTENSION_OPTIONS[value],
      })),
      initialValues,
      required: false,
    }),
  );
};

const promptSecret = async (
  message: string,
  validate: (value: string) => true | string,
): Promise<string | undefined> => {
  const value = await ask(
    password({ message, mask: '*', validate: toClackValidate(validate) }),
  );
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const promptEvmPrivateKey = (): Promise<string | undefined> =>
  promptSecret(
    'Your EVM wallet private key for setup (optional, press Enter to skip)',
    validateEvmPrivateKey,
  );

export const promptSubstrateMnemonic = (): Promise<string | undefined> =>
  promptSecret(
    'Your Substrate wallet mnemonic for setup (optional, press Enter to skip)',
    validateSubstrateMnemonic,
  );

export const promptName = (
  initialValue: string,
  validate: (value: string) => true | string,
) =>
  ask(
    text({
      message: 'Name your project',
      initialValue,
      validate: toClackValidate(validate),
    }),
  );

export const promptPackageManager = (initialValue: TPackageManager) =>
  ask(
    select<TPackageManager>({
      message: 'Choose a package manager',
      options: PACKAGE_MANAGERS.map((pm) => ({
        value: pm,
        label: pm,
        hint: pm === initialValue ? 'recommended' : undefined,
      })),
      initialValue,
    }),
  );

const promptFramework = () =>
  ask(
    select<TFramework>({
      message: 'Choose a framework',
      options: FRAMEWORKS.map((value) => {
        const option = FRAMEWORK_OPTIONS[value];
        return {
          value,
          label: option.label,
          hint: option.hint,
        };
      }),
      initialValue: DEFAULT_FRAMEWORK,
    }),
  );

const promptProjectType = () =>
  ask(
    select<TProjectType>({
      message: 'What would you like to build?',
      options: PROJECT_TYPES.map((value) => ({
        value,
        label: PROJECT_TYPE_OPTIONS[value].label,
        hint: PROJECT_TYPE_OPTIONS[value].hint,
      })),
      initialValue: DEFAULT_PROJECT_TYPE,
    }),
  );

export const promptClient = () =>
  ask(
    select<TSdkClient>({
      message: 'Choose a Polkadot client',
      options: SDK_CLIENTS.map((value) => ({
        value,
        ...SDK_CLIENT_OPTIONS[value],
      })),
      initialValue: DEFAULT_SDK_CLIENT,
    }),
  );

export const promptProjectBasics = () =>
  group({
    projectType: promptProjectType,
    framework: promptFramework,
  });

export const promptConfigureWallet = (): Promise<boolean> =>
  ask(
    confirm({
      message: 'Configure a development wallet now?',
      active: 'Configure now',
      inactive: 'Skip',
      initialValue: false,
    }),
  );

export const promptGenerateOptions = async (
  input: TResolveInput,
  options: TPromptGenerateOptions = {},
): Promise<TResolvedOptions> => {
  const isNode = input.framework === 'node';
  const providedSubstrateMnemonic = validateProvidedSecret(
    input.substrateMnemonic,
    '--substrate-mnemonic',
    validateSubstrateMnemonic,
  );
  const providedPrivateKey = validateProvidedSecret(
    input.privateKey,
    '--private-key',
    validateEvmPrivateKey,
  );

  const answers = await group({
    client: () =>
      input.kind === 'sdk' && input.client === undefined
        ? promptClient()
        : undefined,
    extensions: () =>
      extensionsProvided(input)
        ? undefined
        : promptExtensions(input.extensions),
    name: () =>
      input.name === undefined
        ? promptName(
            PROJECT_TYPE_OPTIONS[input.kind].defaultName,
            options.validateName ?? validateNameInput,
          )
        : undefined,
    packageManager: () =>
      input.packageManager === undefined
        ? promptPackageManager(DEFAULT_PACKAGE_MANAGER)
        : undefined,
    configureWallet: ({ results }) => {
      const extensions = resolveExtensions(
        input.extensions,
        results.extensions,
      );
      const needsPrivateKey =
        requiresEvmWallet(extensions) && providedPrivateKey === undefined;
      const needsWalletSetup =
        isNode && (providedSubstrateMnemonic === undefined || needsPrivateKey);
      return needsWalletSetup ? promptConfigureWallet() : undefined;
    },
    substrateMnemonic: ({ results }) =>
      isNode &&
      providedSubstrateMnemonic === undefined &&
      results.configureWallet === true
        ? promptSubstrateMnemonic()
        : undefined,
    privateKey: ({ results }) => {
      const extensions = resolveExtensions(
        input.extensions,
        results.extensions,
      );
      return isNode &&
        requiresEvmWallet(extensions) &&
        providedPrivateKey === undefined &&
        results.configureWallet === true
        ? promptEvmPrivateKey()
        : undefined;
    },
  });

  const extensions = resolveExtensions(input.extensions, answers.extensions);
  const promptedPrivateKey =
    typeof answers.privateKey === 'string' ? answers.privateKey : undefined;
  const promptedSubstrateMnemonic =
    typeof answers.substrateMnemonic === 'string'
      ? answers.substrateMnemonic
      : undefined;

  return applyGenerateDefaults({
    ...input,
    name: input.name ?? answers.name,
    client: input.client ?? answers.client,
    extensions,
    packageManager: input.packageManager ?? answers.packageManager,
    privateKey: providedPrivateKey ?? promptedPrivateKey,
    substrateMnemonic: providedSubstrateMnemonic ?? promptedSubstrateMnemonic,
  });
};
