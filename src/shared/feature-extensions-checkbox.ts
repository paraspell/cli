/**
 * Checkbox prompt for optional XCM feature extensions.
 */
import {
  createPrompt,
  isDownKey,
  isEnterKey,
  isNumberKey,
  isSpaceKey,
  isUpKey,
  makeTheme,
  Separator,
  useKeypress,
  useMemo,
  usePagination,
  usePrefix,
  useState,
  ValidationError,
} from '@inquirer/core';
import { cursorHide } from '@inquirer/ansi';
import figures from '@inquirer/figures';
import { styleText } from 'node:util';

export const SWAP_EXTENSION = 'swap-extension';
export const EVM_EXTENSION = 'evm-extension';
export const SNOWBRIDGE_EXTENSION = 'snowbridge-extension';

type ExtensionValue =
  | typeof SWAP_EXTENSION
  | typeof EVM_EXTENSION
  | typeof SNOWBRIDGE_EXTENSION;

type ExtensionChoice = {
  value: ExtensionValue;
  name: string;
  checkedName: string;
  short: string;
  disabled: boolean | string;
  checked: boolean;
  description?: string;
};

const checkboxTheme = {
  icon: {
    checked: styleText('green', figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
    disabledChecked: styleText('green', figures.circleDouble),
    disabledUnchecked: '-',
  },
  style: {
    disabled: (text: string) => styleText('dim', text),
    renderSelectedChoices: (selected: ReadonlyArray<ExtensionChoice>) =>
      selected.map((c) => c.short).join(', '),
    description: (text: string) => styleText('cyan', text),
    keysHelpTip: (keys: [string, string][]) =>
      keys.map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`).join(styleText('dim', ' • ')),
  },
  i18n: { disabledError: 'This option is disabled and cannot be toggled.' },
};

function isSelectable(item: ExtensionChoice | Separator): item is ExtensionChoice {
  return !Separator.isSeparator(item) && !item.disabled;
}

function isNavigable(item: ExtensionChoice | Separator): item is ExtensionChoice {
  return !Separator.isSeparator(item);
}

function isChecked(item: ExtensionChoice | Separator): item is ExtensionChoice {
  return !Separator.isSeparator(item) && item.checked;
}

function toggle(item: ExtensionChoice | Separator): ExtensionChoice | Separator {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}

function toggleAt(
  items: Array<ExtensionChoice | Separator>,
  toggledIndex: number,
): Array<ExtensionChoice | Separator> {
  return items.map((choice, i) => (i === toggledIndex ? toggle(choice) : choice));
}

export type FeatureExtensionsDefaults = {
  evm?: boolean;
  swap?: boolean;
  snowbridge?: boolean;
};

function defaultChoices(
  defaults: FeatureExtensionsDefaults = {},
): Array<ExtensionChoice | Separator> {
  return [
    new Separator(),
    {
      value: SWAP_EXTENSION,
      name: 'Swap extension',
      checkedName: 'Swap extension',
      short: 'Swap',
      disabled: false,
      checked: defaults.swap ?? false,
      description: 'Cross-chain swaps via @paraspell/swap',
    },
    {
      value: EVM_EXTENSION,
      name: 'EVM extension',
      checkedName: 'EVM extension',
      short: 'EVM',
      disabled: false,
      checked: defaults.evm ?? false,
      description: 'Enables EVM chains to be used as origin chains',
    },
    {
      value: SNOWBRIDGE_EXTENSION,
      name: 'Snowbridge extension',
      checkedName: 'Snowbridge extension',
      short: 'Snowbridge',
      disabled: false,
      checked: defaults.snowbridge ?? false,
      description: 'Snowbridge cross-chain transfers',
    },
  ];
}

type FeatureExtensionsConfig = {
  message: string;
  pageSize?: number;
  loop?: boolean;
  defaults?: FeatureExtensionsDefaults;
};

const featureExtensionsCheckbox = createPrompt<ExtensionValue[], FeatureExtensionsConfig>(
  (config, done) => {
  const { message, pageSize = 7, loop = true, defaults } = config;
  const theme = makeTheme(checkboxTheme);
  const { keybindings } = theme;

  const [status, setStatus] = useState<'idle' | 'done'>('idle');
  const prefix = usePrefix({ status, theme });
  const [items, setItems] = useState(defaultChoices(defaults));

  const bounds = useMemo(() => {
    const first = items.findIndex(isNavigable);
    let last = -1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (isNavigable(items[i])) {
        last = i;
        break;
      }
    }
    if (first === -1) {
      throw new ValidationError('[feature-extensions] No selectable choices.');
    }
    return { first, last };
  }, [items]);

  const [active, setActive] = useState(bounds.first);
  const [errorMsg, setError] = useState<string | undefined>();

  useKeypress((key) => {
    if (isEnterKey(key)) {
      setStatus('done');
      done(items.filter(isChecked).map((c) => c.value));
      return;
    }

    if (isUpKey(key, keybindings) || isDownKey(key, keybindings)) {
      if (errorMsg) setError(undefined);
      if (
        loop ||
        (isUpKey(key, keybindings) && active !== bounds.first) ||
        (isDownKey(key, keybindings) && active !== bounds.last)
      ) {
        const offset = isUpKey(key, keybindings) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isNavigable(items[next]));
        setActive(next);
      }
      return;
    }

    if (isSpaceKey(key)) {
      const activeItem = items[active];
      if (activeItem && !Separator.isSeparator(activeItem)) {
        if (activeItem.disabled) {
          setError(theme.i18n.disabledError);
        } else {
          setError(undefined);
          setItems(toggleAt(items, active));
        }
      }
      return;
    }

    if (isNumberKey(key)) {
      const selectedIndex = Number(key.name) - 1;
      let selectableIndex = -1;
      const position = items.findIndex((item) => {
        if (Separator.isSeparator(item)) return false;
        selectableIndex++;
        return selectableIndex === selectedIndex;
      });
      const selectedItem = items[position];
      if (selectedItem && isSelectable(selectedItem)) {
        setActive(position);
        setItems(toggleAt(items, position));
      }
    }
  });

  const messageLine = theme.style.message(message, status);
  let description: string | undefined;

  const page = usePagination({
    items,
    active,
    renderItem({ item, isActive }) {
      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }
      const cursor = isActive ? theme.icon.cursor : ' ';
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === 'string' ? item.disabled : '(disabled)';
        const checkbox = item.checked ? theme.icon.disabledChecked : theme.icon.disabledUnchecked;
        return theme.style.disabled(`${cursor}${checkbox} ${item.name} ${disabledLabel}`);
      }
      if (isActive) {
        description = item.description;
      }
      const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
      const name = item.checked ? item.checkedName : item.name;
      const color = isActive ? theme.style.highlight : (x: string) => x;
      return color(`${cursor}${checkbox} ${name}`);
    },
    pageSize,
    loop,
  });

  if (status === 'done') {
    const selection = items.filter(isChecked);
    const answer = theme.style.answer(theme.style.renderSelectedChoices(selection));
    return [prefix, messageLine, answer].filter(Boolean).join(' ');
  }

  const helpLine = theme.style.keysHelpTip([
    ['↑↓', 'navigate'],
    ['space', 'select'],
    ['⏎', 'submit'],
  ]);

  const lines = [
    [prefix, messageLine].filter(Boolean).join(' '),
    page,
    ' ',
    description ? theme.style.description(description) : '',
    errorMsg ? theme.style.error(errorMsg) : '',
    helpLine,
  ]
    .filter(Boolean)
    .join('\n')
    .trimEnd();

  return `${lines}${cursorHide}`;
  },
);

export async function promptFeatureExtensions(
  defaults?: FeatureExtensionsDefaults,
): Promise<ExtensionValue[]> {
  return featureExtensionsCheckbox({
    message: 'Select the desired additional features',
    defaults,
  }) as Promise<ExtensionValue[]>;
}
