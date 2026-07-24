import type { TGeneratedVariant } from './variants.js';
import { installProject, runProjectScript } from './run-project.js';

export interface TTypecheckResult {
  variant: TGeneratedVariant;
  ok: boolean;
  steps: { name: string; ok: boolean; output: string }[];
}

export const typecheckVariant = async (
  variant: TGeneratedVariant,
  timeoutMs: number,
): Promise<TTypecheckResult> => {
  const steps: TTypecheckResult['steps'] = [];

  const { pm, step: install } = await installProject(
    variant.absPath,
    timeoutMs,
  );
  steps.push(install);
  if (!install.ok) {
    return { variant, ok: false, steps };
  }

  const typecheck = await runProjectScript(
    variant.absPath,
    pm,
    'typecheck',
    timeoutMs,
  );
  steps.push(typecheck);
  if (!typecheck.ok) {
    return { variant, ok: false, steps };
  }

  return { variant, ok: true, steps };
};
