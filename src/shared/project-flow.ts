import { cancel, log, spinner } from '@clack/prompts';
import { generateApp } from '../generator/generate.js';
import type { TGenerateAppParams } from '../generator/types.js';
import { FRAMEWORK_OPTIONS, PROJECT_TYPE_OPTIONS } from './project-options.js';
import { installDependencies } from './install-dependencies.js';
import { printNextSteps, type TInstallationStatus } from './next-steps.js';
import { promptGenerateOptions, reviewProject } from './prompts.js';
import {
  applyGenerateDefaults,
  hasRejectedSecrets,
} from './resolve-options.js';
import type { TResolveInput } from './types.js';

type TProjectFlowOptions = {
  input: TResolveInput;
  resolveOut: (name: string) => string;
  validateTarget?: (name: string, outDir: string) => true | string;
  interactive: boolean;
  userFacing: boolean;
};

const scaffoldProject = async (
  params: TGenerateAppParams,
  options: Pick<TProjectFlowOptions, 'interactive' | 'userFacing'>,
): Promise<void> => {
  const { kind, opts } = params;
  const scaffoldSpinner = options.userFacing ? spinner() : undefined;
  scaffoldSpinner?.start(
    `Creating your ${FRAMEWORK_OPTIONS[opts.framework].label} ${PROJECT_TYPE_OPTIONS[kind].label} project`,
  );

  try {
    await generateApp(params);
    scaffoldSpinner?.stop('Project files created');
  } catch (error) {
    scaffoldSpinner?.error('Could not create project files');
    throw error;
  }

  let installation: TInstallationStatus = 'skipped';
  if (options.interactive && options.userFacing) {
    const installSpinner = spinner();
    installSpinner.start(`Running ${opts.packageManager} install`);
    const install = await installDependencies(opts.out, opts.packageManager);
    if (install.ok) {
      installation = 'installed';
      installSpinner.stop('Dependencies installed');
    } else {
      installation = 'failed';
      installSpinner.error('Dependency installation failed');
      const detail = install.output.trim().split('\n').at(-1);
      const message =
        'The project was created, but dependencies need to be installed manually';
      log.warn(detail ? `${message}: ${detail}` : `${message}.`);
    }
  }

  if (options.userFacing) {
    printNextSteps({
      outDir: opts.out,
      packageManager: opts.packageManager,
      framework: opts.framework,
      installation,
    });
  }
};

export const runProjectFlow = async (
  options: TProjectFlowOptions,
): Promise<void> => {
  if (hasRejectedSecrets(options.input) && !options.interactive) {
    throw new Error(
      'Invalid --private-key or --substrate-mnemonic value. Fix the flag value, or omit it and run on a TTY to enter secrets interactively.',
    );
  }

  const validateTarget = options.validateTarget;
  const resolved = options.interactive
    ? await promptGenerateOptions(options.input, {
        validateName:
          validateTarget === undefined
            ? undefined
            : (name) => validateTarget(name, options.resolveOut(name)),
      })
    : applyGenerateDefaults(options.input);
  const out = options.resolveOut(resolved.name);
  const validation = validateTarget?.(resolved.name, out);
  if (validation !== undefined && validation !== true) {
    throw new Error(validation);
  }

  const params: TGenerateAppParams = {
    kind: options.input.kind,
    opts: {
      framework: options.input.framework,
      ...resolved,
      out,
    },
  };
  if (
    options.interactive &&
    options.userFacing &&
    !(await reviewProject(params))
  ) {
    cancel('No files were created.');
    return;
  }

  await scaffoldProject(params, options);
};
