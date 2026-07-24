import { multiselect } from '@clack/prompts';
import { ask } from './clack.js';

export const SWAP_EXTENSION = 'swap-extension';
export const EVM_EXTENSION = 'evm-extension';
export const SNOWBRIDGE_EXTENSION = 'snowbridge-extension';

export type TExtensionValue =
  typeof SWAP_EXTENSION | typeof EVM_EXTENSION | typeof SNOWBRIDGE_EXTENSION;

export type TExtensionDefaults = {
  evm?: boolean;
  swap?: boolean;
  snowbridge?: boolean;
};

export const promptExtensions = async (
  defaults: TExtensionDefaults = {},
): Promise<TExtensionValue[]> => {
  const initialValues: TExtensionValue[] = [];
  if (defaults.swap) initialValues.push(SWAP_EXTENSION);
  if (defaults.evm) initialValues.push(EVM_EXTENSION);
  if (defaults.snowbridge) initialValues.push(SNOWBRIDGE_EXTENSION);

  return ask(
    multiselect<TExtensionValue>({
      message: 'Select the desired extensions',
      options: [
        {
          value: SWAP_EXTENSION,
          label: 'Swap extension',
          hint: 'Cross-chain swaps via @paraspell/swap',
        },
        {
          value: EVM_EXTENSION,
          label: 'EVM extension',
          hint: 'Enables EVM chains to be used as origin chains',
        },
        {
          value: SNOWBRIDGE_EXTENSION,
          label: 'Snowbridge extension',
          hint: 'Snowbridge cross-chain transfers',
        },
      ],
      initialValues,
      required: false,
    }),
  );
};
