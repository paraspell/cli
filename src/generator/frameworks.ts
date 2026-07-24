import type { TFramework } from '../shared/types.js';
import type { TFrameworkMeta } from './types.js';

export const SDK_FRAMEWORKS: Record<TFramework, TFrameworkMeta> = {
  react: {
    templateSet: 'xcm-sdk-react',
    label: 'React',
    logoFile: 'paraspell.png',
  },
  vue: {
    templateSet: 'xcm-sdk-vue',
    label: 'Vue',
    logoFile: 'paraspell.png',
  },
  node: {
    templateSet: 'xcm-sdk-node',
    label: 'Node.js',
  },
};

export const API_FRAMEWORKS: Record<TFramework, TFrameworkMeta> = {
  react: {
    templateSet: 'xcm-api-react',
    label: 'React',
    logoFile: 'lightspell.png',
  },
  vue: {
    templateSet: 'xcm-api-vue',
    label: 'Vue',
    logoFile: 'lightspell.png',
  },
  node: {
    templateSet: 'xcm-api-node',
    label: 'Node.js',
  },
};
