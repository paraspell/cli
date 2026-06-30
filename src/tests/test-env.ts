import { parseFramework } from '../shared/frameworks.js';
import type { Framework } from '../shared/types.js';
import { listVariants, type VariantKind } from './variants.js';

export function filterVariants(): ReturnType<typeof listVariants> {
  const kind = process.env.TEST_KIND as VariantKind | undefined;
  const frameworkRaw = process.env.TEST_FRAMEWORK;
  const framework = frameworkRaw ? parseFramework(frameworkRaw) : null;

  return listVariants({
    kind: kind === 'sdk' || kind === 'api' ? kind : undefined,
    framework: framework ?? undefined,
  });
}

export function variantTitle(variant: { id: string; framework: Framework }): string {
  return variant.id;
}
