import type { TemplateContext } from "../../types.js";
import { createApiFragments } from "./api.js";
import { createBaseFragments } from "./base.js";
import type { FragmentRenderer, FragmentTemplates } from "./contracts.js";
import { createEvmCoreFragments } from "./evm-core.js";
import { createEvmReactFragments } from "./evm-react.js";
import { createEvmVueFragments } from "./evm-vue.js";
import { createNodeFragments } from "./node.js";
import { createSdkFragments } from "./sdk.js";
import { createSpaFragments } from "./spa.js";
import { createSwapFragments } from "./swap.js";
import { createTypesFragments } from "./types.js";
import { createWalletCoreFragments } from "./wallet-core.js";
import { createWalletReactFragments } from "./wallet-react.js";
import { createWalletVueFragments } from "./wallet-vue.js";
import { createXcmFragments } from "./xcm.js";

export type { FragmentId, FragmentRenderer } from "./contracts.js";

export const createFragmentRenderer = (
  context: TemplateContext,
): FragmentRenderer => {
  let templates: FragmentTemplates;

  const renderFragment: FragmentRenderer = (template) => {
    const render = templates[template];
    if (!render) throw new Error(`Unknown shared template: ${template}`);
    return render();
  };

  templates = {
    ...createBaseFragments(context, renderFragment),
    ...createApiFragments(context, renderFragment),
    ...createEvmCoreFragments(context, renderFragment),
    ...createEvmReactFragments(context, renderFragment),
    ...createEvmVueFragments(context, renderFragment),
    ...createNodeFragments(context, renderFragment),
    ...createSdkFragments(context, renderFragment),
    ...createSpaFragments(context, renderFragment),
    ...createSwapFragments(context, renderFragment),
    ...createTypesFragments(context, renderFragment),
    ...createWalletCoreFragments(context, renderFragment),
    ...createWalletReactFragments(context, renderFragment),
    ...createWalletVueFragments(context, renderFragment),
    ...createXcmFragments(context, renderFragment),
  };

  return renderFragment;
};
