import { password } from '@inquirer/prompts';
import { validateSubstrateMnemonic } from './validate.js';

export async function promptSubstrateMnemonic(): Promise<string | undefined> {
  const value = await password({
    message:
      'Your Substrate wallet mnemonic for setup (optional, press Enter to skip)',
    mask: '*',
    validate: validateSubstrateMnemonic,
  });

  const trimmed = value.trim();
  return trimmed || undefined;
}
