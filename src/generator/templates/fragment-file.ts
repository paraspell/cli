import type { TTemplateFile } from '../types.js';
import type {
  TFragmentId,
  TFragmentRenderer,
} from './shared/fragment-types.js';

export const createFragmentFile = (renderFragment: TFragmentRenderer) => {
  return (
    path: string,
    fragment: TFragmentId,
    skip?: boolean,
  ): TTemplateFile => ({
    path,
    skip,
    render: () => renderFragment(fragment),
  });
};
