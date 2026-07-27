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
          createChainClient,
          type TDedotExtrinsic,${
            swap || evmWallet
              ? source`
          UnsupportedOperationError,`
              : ''
          }${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "@paraspell/sdk-dedot";
        import type { Signer } from "@polkadot/api/types";
        import type { TFormValues${evmWallet ? source`, TWalletSubmitOptions` : ''} } from "../types";
        import { requireCurrency${swap ? source`, requireSwapCurrency` : ''} } from "../requireAsset";
        import { assertSubstrateOrigin } from "../evm/isEvmOrigin";${
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
          const { from, to, recipient, amount${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
          assertSubstrateOrigin(from);
          const currency = requireCurrency(formValues.currency);
        
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(swapEnabled, currencyTo);
            if (!resolvedCurrencyTo) {
              throw new UnsupportedOperationError("Swap destination currency is required.");
            }
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
        }  const client = await createChainClient(from);
          const tx = await Builder(client)
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
              throw new UnsupportedOperationError(
                "EVM origin requires a connected EVM wallet.",
              );
            }
        
            await submitEvmTransferFromForm(
              formValues,
              options.walletClient,
              options.provider,
            );
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new UnsupportedOperationError(
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
        import type { EIP1193Provider } from "mipd";
        import type { TFormValues } from "../types";
        import { requireCurrency${swap ? source`, requireSwapCurrency` : ''} } from "../requireAsset";
        import { ensureEvmWalletClient } from "../evm/evmWalletClient";
        
        export const submitEvmTransferFromForm = async (
          formValues: TFormValues,
          walletClient: WalletClient,
          provider: EIP1193Provider,
        ): Promise<void> => {
          const { from, to, recipient, amount${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
          if (!isChainEvm(from)) {
            throw new Error(\`Unsupported EVM origin: \${from}\`);
          }
        
          const currency = requireCurrency(formValues.currency);
          const signer = await ensureEvmWalletClient(walletClient, from, provider);
        
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(swapEnabled, currencyTo);
            if (!resolvedCurrencyTo) {
              throw new Error("Swap destination currency is required.");
            }
            const builder = Builder()
              .from(from)
              .to(to)
              .currency({ location: currency.location, amount })
              .recipient(recipient)
              .sender(signer)
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
            .sender(signer)
            .signAndSubmit();
        };
        `,
    'xcm/papi': () => source`import {
          Builder,
          type TPapiTransaction,
          UnsupportedOperationError,${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "@paraspell/sdk";
        import {
          InvalidTxError,
          type PolkadotSigner,
          type TxFinalizedPayload,
        } from "polkadot-api";
        import type { TFormValues${evmWallet ? source`, TWalletSubmitOptions` : ''} } from "../types";
        import { requireCurrency${swap ? source`, requireSwapCurrency` : ''} } from "../requireAsset";${
          evmWallet
            ? source`
        import { assertSubstrateOrigin } from "../evm/isEvmOrigin";
        import { submitEvmTransferFromForm } from "./evmTransfer";
        `
            : ''
        }
        export const submitUsingSdk = async (
          formValues: TFormValues,
          ${
            evmWallet
              ? source`options: TWalletSubmitOptions<PolkadotSigner>,`
              : source`signer: PolkadotSigner,
          senderAddress: string,`
          }
        ): Promise<void> => {
          const { from, to, recipient, amount${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
        ${
          evmWallet
            ? source`  if (isChainEvm(from)) {
            if (options.kind !== "evm") {
              throw new UnsupportedOperationError(
                "EVM origin requires a connected EVM wallet.",
              );
            }
        
            await submitEvmTransferFromForm(
              formValues,
              options.walletClient,
              options.provider,
            );
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new UnsupportedOperationError(
              "Substrate origin requires a Polkadot extension wallet.",
            );
          }
        
          const { signer, senderAddress } = options;
        `
            : ''
        }${
          evmWallet
            ? source`
          assertSubstrateOrigin(from);
        `
            : ''
        }
          const currency = requireCurrency(formValues.currency);
        
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(swapEnabled, currencyTo);
            if (!resolvedCurrencyTo) {
              throw new UnsupportedOperationError("Swap destination currency is required.");
            }
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
        
        const submitPapiTransaction = async (
          tx: TPapiTransaction,
          signer: PolkadotSigner,
        ): Promise<TxFinalizedPayload> => {
          return new Promise((resolve, reject) => {
            tx.signSubmitAndWatch(signer).subscribe({
              next: (event) => {
                if (event.type === "finalized") {
                  if (!event.ok) {
                    const errorMsg = event.dispatchError?.value
                      ? JSON.stringify(event.dispatchError.value)
                      : "Transaction failed";
                    reject(new UnsupportedOperationError(errorMsg));
                  } else {
                    resolve(event);
                  }
                }
              },
              error: (error) => {
                if (error instanceof InvalidTxError) {
                  reject(
                    new UnsupportedOperationError(
                      \`Invalid transaction: \${JSON.stringify(error.error)}\`,
                    ),
                  );
                } else {
                  reject(error);
                }
              },
            });
          });
        };
        `,
    'xcm/pjs': () => source`import {
          Builder,
          createChainClient,
          UnsupportedOperationError,
          type Extrinsic,${
            evmWallet
              ? source`
          isChainEvm,`
              : ''
          }
        } from "@paraspell/sdk-pjs";
        import type { Signer } from "@polkadot/api/types";
        import type { TFormValues${evmWallet ? source`, TWalletSubmitOptions` : ''} } from "../types";
        import { requireCurrency${swap ? source`, requireSwapCurrency` : ''} } from "../requireAsset";
        import { assertSubstrateOrigin } from "../evm/isEvmOrigin";${
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
          const { from, to, recipient, amount${swap ? source`, swapEnabled, currencyTo, exchange` : ''} } =
            formValues;
        
          assertSubstrateOrigin(from);
          const currency = requireCurrency(formValues.currency);
        ${
          swap
            ? source`  if (swapEnabled) {
            const resolvedCurrencyTo = requireSwapCurrency(swapEnabled, currencyTo);
            if (!resolvedCurrencyTo) {
              throw new UnsupportedOperationError("Swap destination currency is required.");
            }
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
        }  const api = await createChainClient(from);
          const tx = await Builder(api)
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
                      new UnsupportedOperationError(
                        \`\${section}.\${name}: \${docs.join(" ")}\`,
                      ),
                    );
                  } else {
                    reject(new UnsupportedOperationError(dispatchError.toString()));
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
              throw new UnsupportedOperationError(
                "EVM origin requires a connected EVM wallet.",
              );
            }
        
            await submitEvmTransferFromForm(
              formValues,
              options.walletClient,
              options.provider,
            );
            return;
          }
        
          if (options.kind !== "substrate") {
            throw new UnsupportedOperationError(
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
