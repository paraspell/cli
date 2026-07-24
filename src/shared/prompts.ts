import { select, text } from '@clack/prompts';
import { ask, toClackValidate } from './clack.js';
import { PACKAGE_MANAGERS } from './types.js';
import { SDK_CLIENT_LABELS, SDK_CLIENTS } from './types.js';
import type {
  TFramework,
  TPackageManager,
  TProjectType,
  TSdkClient,
} from './types.js';

export const promptName = (
  initialValue: string,
  validate: (value: string) => true | string,
): Promise<string> => {
  return ask(
    text({
      message: 'Enter the project name',
      initialValue,
      validate: toClackValidate(validate),
    }),
  );
};

export const promptPackageManager = (
  initialValue: TPackageManager,
): Promise<TPackageManager> => {
  return ask(
    select<TPackageManager>({
      message: 'Select the desired package manager',
      options: PACKAGE_MANAGERS.map((pm) => ({ value: pm, label: pm })),
      initialValue,
    }),
  );
};

export const promptFramework = (): Promise<TFramework> => {
  return ask(
    select<TFramework>({
      message: 'Select the desired framework',
      options: [
        { value: 'react', label: 'Vite - React' },
        { value: 'vue', label: 'Vite - Vue' },
        { value: 'node', label: 'NodeJS' },
      ],
    }),
  );
};

export const promptProjectType = (): Promise<TProjectType> => {
  return ask(
    select<TProjectType>({
      message: 'Select the desired project type',
      options: [
        { value: 'sdk', label: 'XCM SDK' },
        { value: 'api', label: 'XCM API' },
      ],
    }),
  );
};

export const promptClient = (initialValue: TSdkClient) => {
  return ask(
    select<TSdkClient>({
      message: 'Select the desired JS client type',
      options: SDK_CLIENTS.map((value) => ({
        value,
        label: SDK_CLIENT_LABELS[value],
      })),
      initialValue,
    }),
  );
};
