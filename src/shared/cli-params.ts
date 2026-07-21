import { FRAMEWORKS, PACKAGE_MANAGERS, SDK_CLIENTS } from "./types.js";

const choiceParser = <T extends string>(
  label: string,
  values: readonly T[],
): ((input: string) => T) => {
  return (input) => {
    const match = values.find((value) => value === input);
    if (match === undefined) {
      throw new Error(
        `Unknown ${label} "${input}". Expected one of: ${values.join(", ")}.`,
      );
    }
    return match;
  };
}

export const parseFrameworkArg = choiceParser("framework", FRAMEWORKS);
export const parseClientArg = choiceParser("client", SDK_CLIENTS);
export const parsePackageManagerArg = choiceParser(
  "package manager",
  PACKAGE_MANAGERS,
);

export const frameworkPositional = {
  kind: "tuple",
  parameters: [
    {
      brief: "Target framework (react | vue | node)",
      parse: parseFrameworkArg,
      optional: true,
      placeholder: "framework",
    },
  ],
} as const;

export const packageManagerFlag = {
  kind: "parsed",
  parse: parsePackageManagerArg,
  brief: "Package manager: npm | yarn | pnpm | bun",
  optional: true,
} as const;
