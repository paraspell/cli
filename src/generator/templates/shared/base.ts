import type { TFragmentFactory, TFragmentId } from './fragment-types.js';
import { source } from '../source.js';

type TBaseFragmentId = Exclude<TFragmentId, `${string}/${string}`>;

export const createBaseFragments: TFragmentFactory<TBaseFragmentId> = (
  context,
) => {
  const {
    extensions: { evm, snowbridge },
  } = context;

  return {
    LICENSE: () => source`MIT License
        
        Copyright (c) 2026 ParaSpell
        
        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:
        
        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.
        
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
        SOFTWARE.
        `,
    'paraspell-side-effects': () =>
      source`${
        evm
          ? source`import "@paraspell/evm";
        `
          : ''
      }${
        snowbridge
          ? source`import "@paraspell/evm-snowbridge";
        `
          : ''
      }`,
    requireAsset:
      () => source`export const requireSwapCurrency = <T extends { location: object }>(
          currencyTo: T | undefined,
        ): T => {
          if (!currencyTo?.location) {
            throw new Error("Swap destination currency is required.");
          }
          return currencyTo;
        };
        `,
  };
};
