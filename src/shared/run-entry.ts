import { isUserError } from './errors.js';

export async function runEntry(main: () => Promise<void>): Promise<void> {
  try {
    await main();
  } catch (error) {
    if (isUserError(error)) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}
