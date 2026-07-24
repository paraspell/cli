import { multiselect } from '@clack/prompts';
import { ask } from './clack.js';
import {
  EXTENSION_KEYS,
  EXTENSION_OPTIONS,
  type TExtensionKey,
  type TExtensions,
} from './project-options.js';

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
