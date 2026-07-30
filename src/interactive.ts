import path from 'node:path';
import { runProjectFlow } from './shared/project-flow.js';
import { promptProjectBasics } from './shared/prompts.js';
import { validateProjectTarget } from './shared/utils.js';

export const runInteractiveGenerate = async (): Promise<void> => {
  const { projectType, framework } = await promptProjectBasics();
  const root = process.cwd();
  const resolveOut = (name: string): string => path.resolve(root, name);

  await runProjectFlow({
    input: {
      kind: projectType,
      framework,
      extensions: {},
    },
    resolveOut,
    validateTarget: validateProjectTarget,
    interactive: true,
    userFacing: true,
  });
};
