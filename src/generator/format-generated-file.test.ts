import { describe, expect, it } from 'vitest';
import { formatGeneratedFile } from './format-generated-file.js';
import { source } from './templates/source.js';

describe('formatGeneratedFile', () => {
  it.each([
    ['config.json', source`{"answer":42}`, '"answer": 42'],
    ['main.ts', source`export const answer=42`, 'answer = 42'],
    [
      'App.vue',
      source`<template><main>Hello</main></template>`,
      '<main>Hello</main>',
    ],
  ])('formats and validates %s', async (path, input, expected) => {
    await expect(formatGeneratedFile(path, input)).resolves.toContain(expected);
  });

  it('leaves unsupported file types unchanged', async () => {
    await expect(
      formatGeneratedFile('LICENSE', source`plain text`),
    ).resolves.toBe('plain text');
  });

  it('identifies formatting failures by file', async () => {
    await expect(
      formatGeneratedFile('broken.json', source`{nope}`),
    ).rejects.toThrow('Unable to format generated file broken.json');
  });

  it('rejects invalid Vue components after formatting', async () => {
    const duplicateTemplate = source`
      <template><main /></template>
      <template><aside /></template>
    `;

    await expect(
      formatGeneratedFile('Broken.vue', duplicateTemplate),
    ).rejects.toThrow('Invalid generated Vue SFC in Broken.vue');
  });
});
