import type { TTemplateContext, TTemplateFile } from '../types.js';
import { source } from './source.js';

const renderReactComponents = (evmWallet: boolean) => source`
  export { SubstrateWalletControls } from "./SubstrateWalletControls";
  export { XcmTransfer } from "./XcmTransfer";
  export { TransferForm } from "./TransferForm";
  ${
    evmWallet
      ? source`
    export { EvmWalletControls } from "./EvmWalletControls";
    export { WalletControls } from "./WalletControls";
    export { WalletKindSelector } from "./WalletKindSelector";
    `
      : ''
  }
`;

const renderVueComponents = (evmWallet: boolean) => source`
  export { default as SubstrateWalletControls } from "./SubstrateWalletControls.vue";
  export { default as XcmTransfer } from "./XcmTransfer.vue";
  export { default as TransferForm } from "./TransferForm.vue";
  ${
    evmWallet
      ? source`
    export { default as EvmWalletControls } from "./EvmWalletControls.vue";
    export { WalletControls } from "./WalletControls";
    export { default as WalletKindSelector } from "./WalletKindSelector.vue";
    `
      : ''
  }
`;

const renderLogic = (context: TTemplateContext) => {
  const {
    clientName,
    extensions: { swap },
    evmWallet,
    projectKind,
  } = context;

  return source`
    ${
      projectKind === 'api'
        ? source`
      export { useApiData } from "./useApiData";
      export { usePapiWallet } from "./usePapiWallet";
      `
        : source`
      export { useCurrencyOptions } from "./useCurrencyOptions";
      export { use${clientName}Wallet } from "./use${clientName}Wallet";
      `
    }
    ${
      evmWallet
        ? source`
      ${
        projectKind === 'api'
          ? source`export { useEvmOriginChains } from "./useEvmOriginChains";
      `
          : ''
      }export { useEvmWallet } from "./useEvmWallet";
      export { useWalletWithEvm } from "./useWalletWithEvm";
      export { useWalletWithEvmCore } from "./useWalletWithEvmCore";
      `
        : ''
    }
    ${
      projectKind === 'api' && swap
        ? source`
      export { useExchangeChains } from "./useExchangeChains";
      `
        : ''
    }
  `;
};

export const createSpaBarrelTemplates = (
  context: TTemplateContext,
): readonly TTemplateFile[] => {
  const isReact = context.framework === 'react';

  return [
    {
      path: 'src/components/index.ts',
      render: () =>
        isReact
          ? renderReactComponents(context.evmWallet)
          : renderVueComponents(context.evmWallet),
    },
    {
      path: isReact ? 'src/hooks/index.ts' : 'src/composables/index.ts',
      render: () => renderLogic(context),
    },
  ];
};
