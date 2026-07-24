import type {
  TTemplateContext,
  TTemplateFile,
  TTemplateSetId,
} from '../types.js';
import { createQualityTemplates } from './quality.js';
import { createFragmentRenderer } from './shared/index.js';
import { createXcmApiNodeTemplates } from './xcm-api-node.js';
import { createXcmApiReactTemplates } from './xcm-api-react.js';
import { createXcmApiVueTemplates } from './xcm-api-vue.js';
import { createXcmSdkNodeTemplates } from './xcm-sdk-node.js';
import { createXcmSdkReactTemplates } from './xcm-sdk-react.js';
import { createXcmSdkVueTemplates } from './xcm-sdk-vue.js';

type TTemplateFactory = (
  context: TTemplateContext,
  renderFragment: ReturnType<typeof createFragmentRenderer>,
) => readonly TTemplateFile[];

const TEMPLATE_FACTORIES = {
  'xcm-api-node': createXcmApiNodeTemplates,
  'xcm-api-react': createXcmApiReactTemplates,
  'xcm-api-vue': createXcmApiVueTemplates,
  'xcm-sdk-node': createXcmSdkNodeTemplates,
  'xcm-sdk-react': createXcmSdkReactTemplates,
  'xcm-sdk-vue': createXcmSdkVueTemplates,
} satisfies Record<TTemplateSetId, TTemplateFactory>;

export const createTemplateFiles = (
  templateSet: TTemplateSetId,
  context: TTemplateContext,
): readonly TTemplateFile[] => {
  const renderFragment = createFragmentRenderer(context);
  return [
    ...TEMPLATE_FACTORIES[templateSet](context, renderFragment),
    ...createQualityTemplates(context),
  ];
};
