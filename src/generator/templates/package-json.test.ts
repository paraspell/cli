import { describe, expect, it } from 'vitest';
import {
  FRAMEWORKS,
  PROJECT_TYPES,
  SDK_CLIENTS,
} from '../../shared/project-options.js';
import { createTemplateContext } from '../context.js';
import {
  TEMPLATE_PACKAGE_VERSIONS,
  type TTemplatePackage,
} from '../versions.js';
import { renderPackageJson } from './package-json.js';

type TRenderedManifest = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe('renderPackageJson', () => {
  it('classifies framework packages as runtime or development dependencies', () => {
    const render = (framework: 'react' | 'vue') => {
      const context = createTemplateContext({
        kind: 'api',
        opts: {
          framework,
          name: `${framework}-dependency-test`,
          client: 'papi',
          packageManager: 'pnpm',
          out: '/tmp/not-written',
          extensions: { evm: false, swap: false, snowbridge: false },
        },
      });
      return JSON.parse(renderPackageJson(context)) as TRenderedManifest;
    };

    const react = render('react');
    expect(react.dependencies).toHaveProperty('react');
    expect(react.dependencies).toHaveProperty('react-dom');
    expect(react.devDependencies).not.toHaveProperty('react');

    const vue = render('vue');
    expect(vue.dependencies).toHaveProperty('vue');
    expect(vue.devDependencies).toHaveProperty('@vue/tsconfig');
  });

  it('uses every canonical template dependency at its configured version', () => {
    const emittedPackages = new Set<string>();
    const extensions = { evm: true, swap: true, snowbridge: true };

    for (const kind of PROJECT_TYPES) {
      for (const framework of FRAMEWORKS) {
        const clients = kind === 'sdk' ? SDK_CLIENTS : (['papi'] as const);

        for (const client of clients) {
          const context = createTemplateContext({
            kind,
            opts: {
              framework,
              name: 'dependency-test',
              client,
              packageManager: 'pnpm',
              out: '/tmp/not-written',
              extensions,
            },
          });
          const manifest = JSON.parse(
            renderPackageJson(context),
          ) as TRenderedManifest;
          const dependencies = {
            ...manifest.dependencies,
            ...manifest.devDependencies,
          };

          for (const [packageName, version] of Object.entries(dependencies)) {
            emittedPackages.add(packageName);
            expect(version).toBe(
              TEMPLATE_PACKAGE_VERSIONS[packageName as TTemplatePackage],
            );
          }
        }
      }
    }

    expect([...emittedPackages].sort()).toEqual(
      Object.keys(TEMPLATE_PACKAGE_VERSIONS).sort(),
    );
  });
});
