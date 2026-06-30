import type { GeneratedVariant } from './variants.js';
import { installProject, runProjectScript } from './run-project.js';

export interface BuildResult {
  variant: GeneratedVariant;
  ok: boolean;
  steps: { name: string; ok: boolean; output: string }[];
}

export async function buildVariant(
  variant: GeneratedVariant,
  timeoutMs: number,
): Promise<BuildResult> {
  const steps: BuildResult['steps'] = [];

  const { pm, step: install } = await installProject(variant.absPath, timeoutMs);
  steps.push(install);
  if (!install.ok) {
    return { variant, ok: false, steps };
  }

  const scripts =
    variant.framework === 'node'
      ? (['typecheck', 'build'])
      : (['build', 'lint']);

  for (const script of scripts) {
    const result = await runProjectScript(variant.absPath, pm, script, timeoutMs);
    steps.push(result);
    if (!result.ok) {
      return { variant, ok: false, steps };
    }
  }

  return { variant, ok: true, steps };
}
