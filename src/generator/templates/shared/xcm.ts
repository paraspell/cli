import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TXcmFragmentId = Extract<TFragmentId, `xcm/${string}`>;

export const createXcmFragments: TFragmentFactory<TXcmFragmentId> = (
  context,
) => {
  const {
    sdkPackage,
    extensions: { swap },
    evmWallet,
  } = context;

  return {
    'xcm/dedot': () => source`import {
          Builder,
          type TDedotExtrinsic,${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "@paraspell/sdk-dedot";
        import type { Signer } from "@polkadot/api/types";
        import type { TFormValues${evmWallet ? source`, TWalletSubmitOptions` : ''} } from "../types";
        ${
          swap
            ? source`import { requireSwapCurrency } from "../requireAsset";
        `
            : ''
        }
        ${
          evmWallet
            ? source`
        import { submitEvmTransferFromForm } from "./evmTransfer";
        `
            : ''
        }
        const buildTransactions = async (
          formValues: TFormValues,
          senderAddress: string,
        ): Promise<TDedotExtrinsic[]> => {
          const { from, to, recipient, amount, currency${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(currencyTo);
            const contexts = await Builder()
              .from(from)
              .to(to)
              .currency({ location: currency.location, amount })
              .recipient(recipient)
              .swap({
                currencyTo: { location: resolvedCurrencyTo.location },
                ...(exchange?.length ? { exchange } : {}),
              })
              .sender(senderAddress)
              .buildAll();
        
            return contexts.map((ctx) => ctx.tx);
          }
        
        `
            : ''
        }  const tx = await Builder()
            .from(from)
            .to(to)
            .currency({ location: currency.location, amount })
            .recipient(recipient)
            .sender(senderAddress)
            .build();
        
          return [tx];
        };
        
        const submitTransaction = async (
          tx: TDedotExtrinsic,
          senderAddress: string,
          signer: Signer,
        ): Promise<void> => {
          await tx.signAndSend(senderAddress, { signer }).untilFinalized();
        };
        
        export const submitUsingSdk = async (
          formValues: TFormValues,
          ${
            evmWallet
              ? source`options: TWalletSubmitOptions<Signer>,`
              : source`signer: Signer,
          senderAddress: string,`
          }
        ): Promise<void> => {
        ${
          evmWallet
            ? source`  if (isChainEvm(formValues.from)) {
            if (options.kind !== "evm") {
              throw new Error(
                "EVM origin requires a connected EVM wallet.",
              );
            }
        
            await submitEvmTransferFromForm(
              formValues,
              options.walletClient,
            );
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new Error(
              "Substrate origin requires a Polkadot extension wallet.",
            );
          }
        
          const { signer, senderAddress } = options;
        
        `
            : ''
        }  if (!senderAddress) {
            alert("No account selected, connect wallet first");
            return;
          }
        
          const txs = await buildTransactions(formValues, senderAddress);
        
          for (const tx of txs) {
            await submitTransaction(tx, senderAddress, signer);
          }
        };
        `,
    'xcm/evmTransfer.sdk':
      () => source`import { Builder, isChainEvm } from "${sdkPackage}";${
        swap
          ? source`
        import "@paraspell/swap";`
          : ''
      }
        import type { WalletClient } from "viem";
        import type { TFormValues } from "../types";
        ${
          swap
            ? source`import { requireSwapCurrency } from "../requireAsset";
        `
            : ''
        }
        
        export const submitEvmTransferFromForm = async (
          formValues: TFormValues,
          walletClient: WalletClient,
        ): Promise<void> => {
          const { from, to, recipient, amount, currency${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
          if (!isChainEvm(from)) {
            throw new Error(\`Unsupported EVM origin: \${from}\`);
          }
          if (!walletClient.account) {
            throw new Error(
              "EVM wallet has no account. Disconnect and connect again.",
            );
          }
        
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(currencyTo);
            const builder = Builder()
              .from(from)
              .to(to)
              .currency({ location: currency.location, amount })
              .recipient(recipient)
              .sender(walletClient)
              .swap({
                currencyTo: { location: resolvedCurrencyTo.location },
                ...(exchange?.length ? { exchange } : {}),
              });
        
            await builder.signAndSubmitAll();
            return;
          }
        
        `
            : ''
        }  await Builder()
            .from(from)
            .to(to)
            .currency({ location: currency.location, amount })
            .recipient(recipient)
            .sender(walletClient)
            .signAndSubmit();
        };
        `,
    'xcm/papi': () => source`import {
          Builder,${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "@paraspell/sdk";
        import type { PolkadotSigner } from "polkadot-api";
        import type { TFormValues${evmWallet ? source`, TWalletSubmitOptions` : ''} } from "../types";
        ${
          swap
            ? source`import { requireSwapCurrency } from "../requireAsset";
        `
            : ''
        }${
          evmWallet
            ? source`
        import { submitEvmTransferFromForm } from "./evmTransfer";
        `
            : ''
        }import { submitPapiTransaction } from "./submitPapiTransaction";
        export const submitUsingSdk = async (
          formValues: TFormValues,
          ${
            evmWallet
              ? source`options: TWalletSubmitOptions<PolkadotSigner>,`
              : source`signer: PolkadotSigner,
          senderAddress: string,`
          }
        ): Promise<void> => {
          const { from, to, recipient, amount, currency${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
        ${
          evmWallet
            ? source`  if (isChainEvm(from)) {
            if (options.kind !== "evm") {
              throw new Error(
                "EVM origin requires a connected EVM wallet.",
              );
            }
        
            await submitEvmTransferFromForm(
              formValues,
              options.walletClient,
            );
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new Error(
              "Substrate origin requires a Polkadot extension wallet.",
            );
          }
        
          const { signer, senderAddress } = options;
        `
            : ''
        }
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(currencyTo);
            const contexts = await Builder()
              .from(from)
              .to(to)
              .currency({ location: currency.location, amount })
              .recipient(recipient)
              .swap({
                currencyTo: { location: resolvedCurrencyTo.location },
                ...(exchange?.length ? { exchange } : {}),
              })
              .sender(senderAddress)
              .buildAll();
        
            for (const ctx of contexts) {
              await submitPapiTransaction(ctx.tx, signer);
            }
            return;
          }
        
        `
            : ''
        }  const tx = await Builder()
            .from(from)
            .to(to)
            .currency({ location: currency.location, amount })
            .recipient(recipient)
            .sender(senderAddress)
            .build();
        
          await submitPapiTransaction(tx, signer);
        };
        `,
    'xcm/pjs': () => source`import {
          Builder,
          type Extrinsic,${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "@paraspell/sdk-pjs";
        import type { Signer } from "@polkadot/api/types";
        import type { TFormValues${evmWallet ? source`, TWalletSubmitOptions` : ''} } from "../types";
        ${
          swap
            ? source`import { requireSwapCurrency } from "../requireAsset";
        `
            : ''
        }
        ${
          evmWallet
            ? source`
        import { submitEvmTransferFromForm } from "./evmTransfer";
        `
            : ''
        }
        const buildTransaction = async (
          formValues: TFormValues,
          senderAddress: string,
        ): Promise<Extrinsic[]> => {
          const { from, to, recipient, amount, currency${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(currencyTo);
            const contexts = await Builder()
              .from(from)
              .to(to)
              .currency({ location: currency.location, amount })
              .recipient(recipient)
              .swap({
                currencyTo: { location: resolvedCurrencyTo.location },
                ...(exchange?.length ? { exchange } : {}),
              })
              .sender(senderAddress)
              .buildAll();
        
            return contexts.map((ctx) => ctx.tx);
          }
        
        `
            : ''
        }  const tx = await Builder()
            .from(from)
            .to(to)
            .currency({ location: currency.location, amount })
            .recipient(recipient)
            .sender(senderAddress)
            .build();
        
          return [tx];
        };
        
        const submitTransaction = async (
          tx: Extrinsic,
          senderAddress: string,
          signer: Signer,
        ): Promise<void> => {
          await tx.signAsync(senderAddress, { signer });
        
          await new Promise<void>((resolve, reject) => {
            void tx
              .send((result) => {
                if (!result.status.isFinalized) {
                  return;
                }
        
                const { dispatchError } = result;
        
                if (dispatchError) {
                  if (dispatchError.isModule) {
                    const { docs, name, section } = tx.registry.findMetaError(
                      dispatchError.asModule,
                    );
                    reject(
                      new Error(
                        \`\${section}.\${name}: \${docs.join(" ")}\`,
                      ),
                    );
                  } else {
                    reject(new Error(dispatchError.toString()));
                  }
                  return;
                }
        
                resolve();
              })
              .catch((error) => {
                reject(error);
              });
          });
        };
        
        export const submitUsingSdk = async (
          formValues: TFormValues,
          ${
            evmWallet
              ? source`options: TWalletSubmitOptions<Signer>,`
              : source`signer: Signer,
          senderAddress: string,`
          }
        ): Promise<void> => {
        ${
          evmWallet
            ? source`  if (isChainEvm(formValues.from)) {
            if (options.kind !== "evm") {
              throw new Error(
                "EVM origin requires a connected EVM wallet.",
              );
            }
        
            await submitEvmTransferFromForm(
              formValues,
              options.walletClient,
            );
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new Error(
              "Substrate origin requires a Polkadot extension wallet.",
            );
          }
        
          const { signer, senderAddress } = options;
        
        `
            : ''
        }  if (!senderAddress) {
            alert("No account selected, connect wallet first");
            return;
          }
        
          const txs = await buildTransaction(formValues, senderAddress);
          for (const tx of txs) {
            await submitTransaction(tx, senderAddress, signer);
          }
        };
        `,
  };
};
