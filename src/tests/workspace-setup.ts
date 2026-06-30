import { beforeAll } from 'vitest';
import {
  ensureGeneratedWorkspaceInstall,
  WORKSPACE_INSTALL_TIMEOUT_MS,
} from './workspace-install.js';

beforeAll(async () => {
  await ensureGeneratedWorkspaceInstall();
}, WORKSPACE_INSTALL_TIMEOUT_MS);
