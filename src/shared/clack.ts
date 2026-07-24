import { cancel, isCancel } from '@clack/prompts';

export const ask = async <T>(prompt: Promise<T | symbol>): Promise<T> => {
  const value = await prompt;
  if (isCancel(value)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
  return value;
};

export const toClackValidate = (
  validate: (value: string) => true | string,
): ((value: string | undefined) => string | undefined) => {
  return (value) => {
    const result = validate(value ?? '');
    return result === true ? undefined : result;
  };
};
