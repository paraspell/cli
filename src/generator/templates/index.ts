import type { TTemplateContext, TTemplateFile } from '../types.js';
import { createQualityTemplates } from './quality.js';
import { createScaffoldTemplates } from './scaffold.js';
import { createFragmentRenderer } from './shared/index.js';
import { createNodeApiTemplates } from './node/api.js';
import { createNodeSdkTemplates } from './node/sdk.js';
import { createReactApiTemplates } from './react/api.js';
import { createReactSdkTemplates } from './react/sdk.js';
import { createVueApiTemplates } from './vue/api.js';
import { createVueSdkTemplates } from './vue/sdk.js';

const TEMPLATE_FACTORIES = {
  api: {
    node: createNodeApiTemplates,
    react: createReactApiTemplates,
    vue: createVueApiTemplates,
  },
  sdk: {
    node: createNodeSdkTemplates,
    react: createReactSdkTemplates,
    vue: createVueSdkTemplates,
  },
};

export const createTemplateFiles = (
  context: TTemplateContext,
): readonly TTemplateFile[] => {
  const renderFragment = createFragmentRenderer(context);
  return [
    ...createScaffoldTemplates(context, renderFragment),
    ...TEMPLATE_FACTORIES[context.projectKind][context.framework](
      context,
      renderFragment,
    ),
    ...createQualityTemplates(context),
  ].filter((template) => !template.skip);
};
