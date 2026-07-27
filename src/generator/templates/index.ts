import type { TTemplateContext, TTemplateFile } from '../types.js';
import { createQualityTemplates } from './quality.js';
import { createScaffoldTemplates } from './scaffold.js';
import { createFragmentRenderer } from './shared/index.js';
import { createXcmApiNodeTemplates } from './xcm-api-node.js';
import { createXcmApiReactTemplates } from './xcm-api-react.js';
import { createXcmApiVueTemplates } from './xcm-api-vue.js';
import { createXcmSdkNodeTemplates } from './xcm-sdk-node.js';
import { createXcmSdkReactTemplates } from './xcm-sdk-react.js';
import { createXcmSdkVueTemplates } from './xcm-sdk-vue.js';

const TEMPLATE_FACTORIES = {
  api: {
    node: createXcmApiNodeTemplates,
    react: createXcmApiReactTemplates,
    vue: createXcmApiVueTemplates,
  },
  sdk: {
    node: createXcmSdkNodeTemplates,
    react: createXcmSdkReactTemplates,
    vue: createXcmSdkVueTemplates,
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
