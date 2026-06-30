import type { TChain, TDestination, TLocation, TSubstrateChain } from "<%= sdkPackage %>";

export type TransferParams = {
  from: TChain;
  to: TDestination;
  amount: string;
  currencyLocation?: TLocation;
  recipient: string;
  currencyToLocation?: TLocation;
};
