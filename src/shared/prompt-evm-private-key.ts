import { password } from '@inquirer/prompts';
import { validateEvmPrivateKey } from './validate.js';

export async function promptEvmPrivateKey(): Promise<string | undefined> {
  const value = await password({
    message:
      'Your EVM wallet private key for setup (optional, press Enter to skip)',
    mask: '*',
    validate: validateEvmPrivateKey,
  });

  const trimmed = value.trim();
  return trimmed || undefined;
}
