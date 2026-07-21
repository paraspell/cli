import { API_FRAMEWORKS, SDK_FRAMEWORKS } from "./frameworks.js";
import { generateApiApp, generateSdkApp } from "./hygen-runner.js";
import type {
  ApiGenerateOptions,
  Framework,
  SdkGenerateOptions,
} from "./types.js";

type GenerateAppParams =
  | {
      kind: "sdk";
      framework: Framework;
      templatesRoot: string;
      opts: SdkGenerateOptions;
    }
  | {
      kind: "api";
      framework: Framework;
      templatesRoot: string;
      opts: ApiGenerateOptions;
    };

export const generateApp = (params: GenerateAppParams): Promise<void> => {
  if (params.kind === "sdk") {
    return generateSdkApp({
      meta: SDK_FRAMEWORKS[params.framework],
      templatesRoot: params.templatesRoot,
      opts: params.opts,
    });
  }
  return generateApiApp({
    meta: API_FRAMEWORKS[params.framework],
    templatesRoot: params.templatesRoot,
    opts: params.opts,
  });
}
