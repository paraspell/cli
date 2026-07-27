import { password } from '@clack/prompts';
import { ask, toClackValidate } from './clack.js';
import {
  validateEvmPrivateKey,
  validateSubstrateMnemonic,
} from './validate.js';

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
