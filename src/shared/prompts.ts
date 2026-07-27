import { confirm, group, select, text } from '@clack/prompts';
import { ask, toClackValidate } from './clack.js';
import {
  DEFAULT_FRAMEWORK,
  DEFAULT_PROJECT_TYPE,
  DEFAULT_SDK_CLIENT,
  FRAMEWORK_OPTIONS,
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  PROJECT_TYPE_OPTIONS,
  PROJECT_TYPES,
  SDK_CLIENT_OPTIONS,
  SDK_CLIENTS,
  type TFramework,
  type TPackageManager,
  type TProjectType,
  type TSdkClient,
} from './project-options.js';

export const promptName = (
  initialValue: string,
  validate: (value: string) => true | string,
): Promise<string> =>
  ask(
    text({
      message: 'Name your project',
      initialValue,
      validate: toClackValidate(validate),
    }),
  );

export const promptPackageManager = (
  initialValue: TPackageManager,
): Promise<TPackageManager> =>
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
