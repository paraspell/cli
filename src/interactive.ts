import fs from 'node:fs';
import path from 'node:path';
import { intro } from '@clack/prompts';
import { CLI_INTRO } from './shared/messages.js';
import { runProjectFlow } from './shared/project-flow.js';
import { promptProjectBasics } from './shared/prompts.js';
import { validateNameInput } from './shared/validate.js';

export const runInteractiveGenerate = async (): Promise<void> => {
  intro(CLI_INTRO);
  const { projectType, framework } = await promptProjectBasics();

  await runProjectFlow({
    input: {
      kind: projectType,
      framework,
      extensions: {},
    },
    resolveOut: ({ name }) => path.join(process.cwd(), name),
    validateName: (name) => {
      const validation = validateNameInput(name);
      const target = path.join(process.cwd(), name.trim());

      return validation === true && fs.existsSync(target)
        ? `Project already exists: ${target}`
        : validation;
    },
    interactive: true,
    userFacing: true,
  });
};
