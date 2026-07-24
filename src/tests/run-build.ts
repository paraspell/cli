import type { TGeneratedVariant } from './variants.js';
import { installProject, runProjectScript } from './run-project.js';

export interface TBuildResult {
  variant: TGeneratedVariant;
  ok: boolean;
  steps: { name: string; ok: boolean; output: string }[];
}

export const buildVariant = async (
  variant: TGeneratedVariant,
  timeoutMs: number,
): Promise<TBuildResult> => {
  const steps: TBuildResult['steps'] = [];

  const { pm, step: install } = await installProject(
    variant.absPath,
    timeoutMs,
  );
  steps.push(install);
  if (!install.ok) {
    return { variant, ok: false, steps };
  }

  const scripts =
    variant.framework === 'node'
      ? ['typecheck', 'build', 'lint', 'format:check']
      : ['build', 'lint', 'format:check'];

  for (const script of scripts) {
    const result = await runProjectScript(
      variant.absPath,
      pm,
      script,
      timeoutMs,
    );
    steps.push(result);
    if (!result.ok) {
      return { variant, ok: false, steps };
    }
  }

  return { variant, ok: true, steps };
};
