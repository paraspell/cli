import path from "node:path";
import { parse as parseVue } from "@vue/compiler-sfc";
import { format } from "prettier";
import { Project, ts } from "ts-morph";
import type { Code } from "ts-poet";

const typeScriptProject = new Project({
  useInMemoryFileSystem: true,
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    allowJs: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ESNext,
  },
});

const PRETTIER_PARSERS: Record<string, string> = {
  ".css": "css",
  ".html": "html",
  ".js": "babel",
  ".json": "json",
  ".md": "markdown",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".vue": "vue",
};

const validateTypeScript = (relativePath: string, source: string): void => {
  const projectPath = path.posix.join(
    "/generated",
    relativePath.split(path.sep).join(path.posix.sep),
  );
  const sourceFile = typeScriptProject.createSourceFile(projectPath, source, {
    overwrite: true,
  });
  const diagnostics = typeScriptProject
    .getProgram()
    .compilerObject.getSyntacticDiagnostics(sourceFile.compilerNode);

  if (diagnostics.length > 0) {
    const details = diagnostics
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      )
      .join("\n");
    throw new Error(
      `Invalid generated TypeScript in ${relativePath}:\n${details}`,
    );
  }
};

const validateVue = (relativePath: string, source: string): void => {
  const { errors } = parseVue(source, { filename: relativePath });
  if (errors.length > 0) {
    const details = errors
      .map((error) => (typeof error === "string" ? error : error.message))
      .join("\n");
    throw new Error(
      `Invalid generated Vue SFC in ${relativePath}:\n${details}`,
    );
  }
};

export const formatGeneratedFile = async (
  relativePath: string,
  sourceCode: Code,
): Promise<string> => {
  const extension = path.extname(relativePath);
  const parser = PRETTIER_PARSERS[extension];
  const source = sourceCode
    .toString({ format: false, path: relativePath })
    .replace(/^\n/, "");
  if (!parser) return source;

  let formatted: string;
  try {
    formatted = await format(source, { filepath: relativePath, parser });
  } catch (error) {
    throw new Error(`Unable to format generated file ${relativePath}`, {
      cause: error,
    });
  }

  if (extension === ".ts" || extension === ".tsx") {
    validateTypeScript(relativePath, formatted);
  } else if (extension === ".vue") {
    validateVue(relativePath, formatted);
  }

  return formatted;
};
