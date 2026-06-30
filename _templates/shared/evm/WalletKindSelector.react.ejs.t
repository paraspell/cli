import type { FC } from "react";
import {
  parseWalletKind,
  WALLET_KIND_OPTIONS,
  type WalletKindSelectorProps,
} from "../../types";

export const WalletKindSelector: FC<WalletKindSelectorProps> = ({
  activeWalletKind,
  setActiveWalletKind,
}) => (
  <div>
    <h4>Select wallet type:</h4>
    <select
      value={activeWalletKind}
      onChange={(event) =>
        setActiveWalletKind(parseWalletKind(event.currentTarget.value))
      }
    >
      {WALLET_KIND_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  </div>
);
