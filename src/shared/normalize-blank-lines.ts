import fs from 'node:fs';
import path from 'node:path';

const TEXT_FILE_PATTERN = /\.(ts|tsx|vue|js|jsx|json|html|css|md)$/;

const EXTRA_BLANK_LINES = /(\r?\n)(?:[ \t]*\r?\n){2,}/;

export function hasExtraBlankLines(content: string): boolean {
  return EXTRA_BLANK_LINES.test(content);
}

export function collapseExtraBlankLines(content: string): string {
  return content.replace(new RegExp(EXTRA_BLANK_LINES.source, 'g'), '$1$1');
}

async function walkTextFiles(
  dir: string,
  files: string[] = [],
): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isDirectory()) {
      await walkTextFiles(full, files);
    } else if (TEXT_FILE_PATTERN.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

export async function normalizeBlankLinesInDir(dir: string): Promise<void> {
  const files = await walkTextFiles(dir);
  await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf8');
      const normalized = collapseExtraBlankLines(content);
      if (normalized !== content) {
        await fs.promises.writeFile(file, normalized);
      }
    }),
  );
}
