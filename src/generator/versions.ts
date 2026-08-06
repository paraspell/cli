import templateDependencies from './template-dependencies/package.json' with { type: 'json' };

export const TEMPLATE_PACKAGE_VERSIONS = templateDependencies.dependencies;

export type TTemplatePackage = keyof typeof TEMPLATE_PACKAGE_VERSIONS;

export const dependencyVersions = (
  ...packageNames: TTemplatePackage[]
): Record<string, string> =>
  Object.fromEntries(
    packageNames.map((packageName) => [
      packageName,
      TEMPLATE_PACKAGE_VERSIONS[packageName],
    ]),
  );
