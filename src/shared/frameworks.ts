import type { Framework, FrameworkMeta } from './types.js';

export const SDK_FRAMEWORKS: Record<Framework, FrameworkMeta> = {
  react: { generator: 'xcm-sdk-react', label: 'React', examplesSubdir: 'react' },
  vue: { generator: 'xcm-sdk-vue', label: 'Vue', examplesSubdir: 'vue' },
  node: { generator: 'xcm-sdk-node', label: 'Node.js', examplesSubdir: 'node' },
};

export const API_FRAMEWORKS: Record<Framework, FrameworkMeta> = {
  react: {
    generator: 'xcm-api-react',
    label: 'React',
    examplesSubdir: 'react',
    logoFile: 'lightspell.png',
  },
  vue: {
    generator: 'xcm-api-vue',
    label: 'Vue',
    examplesSubdir: 'vue',
    logoFile: 'lightspell.png',
  },
  node: { generator: 'xcm-api-node', label: 'Node.js', examplesSubdir: 'node' },
};
