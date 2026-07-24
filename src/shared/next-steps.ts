import path from 'node:path';
import { note, outro } from '@clack/prompts';
import {
  FRAMEWORK_OPTIONS,
  packageRunCommand,
  type TFramework,
  type TPackageManager,
} from './project-options.js';

export type TInstallationStatus = 'installed' | 'failed' | 'skipped';

type TNextStepsOptions = {
  outDir: string;
  packageManager: TPackageManager;
  framework: TFramework;
  installation: TInstallationStatus;
};

export const printNextSteps = ({
  outDir,
  packageManager,
  framework,
  installation,
}: TNextStepsOptions): void => {
  const projectName = path.basename(outDir);
  const cdPath =
    path.relative(process.cwd(), path.resolve(outDir)) || projectName;
  const runScript = packageRunCommand(packageManager);

  const commands = [
    `cd ${cdPath}`,
    ...(installation === 'installed' ? [] : [`${packageManager} install`]),
    `${runScript} ${FRAMEWORK_OPTIONS[framework].startScript}`,
  ];

  note(
    `${commands.join('\n')}\n\nDocs: https://paraspell.github.io/docs/`,
    'Next steps',
  );
  outro(
    installation === 'failed'
      ? `${projectName} was created. Install dependencies to continue.`
      : `${projectName} is ready!`,
  );
};
