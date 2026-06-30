import {
  isChainEvm,
  type TChain,
  type TSubstrateChain,
} from "<%= sdkPackage %>";

export const isSubstrateOrigin = (
  chain: TChain,
): chain is TSubstrateChain => !isChainEvm(chain);

export const assertSubstrateOrigin: (
  chain: TChain,
) => asserts chain is TSubstrateChain = (chain) => {
  if (!isSubstrateOrigin(chain)) {
    throw new Error("EVM origins are submitted via the EVM wallet path.");
  }
};
