import type { FC } from "react";
import type { WalletControlsEvmProps } from "../../types";

export const EvmWalletControls: FC<WalletControlsEvmProps> = ({
  providerOptions,
  selectedProviderUuid,
  accounts,
  selectedAddress,
  onConnectClick,
  onProviderChange,
  onAccountChange,
  onDisconnect,
}) => (
  <>
    {providerOptions.length > 0 ? (
      <div>
        <h4>Select provider:</h4>
        <select
          value={selectedProviderUuid ?? ""}
          onChange={(e) => {
            const uuid = e.target.value;
            if (uuid) onProviderChange(uuid);
          }}
        >
          <option disabled value="">
            -- select an option --
          </option>
          {providerOptions.map(({ uuid, label }) => (
            <option key={uuid} value={uuid}>
              {label}
            </option>
          ))}
        </select>
      </div>
    ) : (
      <button type="button" onClick={onConnectClick}>
        Connect Wallet
      </button>
    )}
    {accounts.length > 0 && (
      <div>
        <h4>Select account:</h4>
        <select
          value={selectedAddress}
          onChange={(e) => onAccountChange(e.target.value)}
        >
          {accounts.map(({ label, address }) => (
            <option key={address} value={address}>
              {label} — {address}
            </option>
          ))}
        </select>
      </div>
    )}
    {selectedAddress && onDisconnect && (
      <button type="button" className="secondary" onClick={onDisconnect}>
        Disconnect
      </button>
    )}
  </>
);
