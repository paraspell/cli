import fs from 'node:fs';
import { validateNameInput } from './validate.js';

export const validateProjectTarget = (
  name: string,
  outDir: string,
): true | string => {
  const nameValidation = validateNameInput(name);
  if (nameValidation !== true) return nameValidation;

  return fs.existsSync(outDir) ? `Project already exists: ${outDir}` : true;
};
