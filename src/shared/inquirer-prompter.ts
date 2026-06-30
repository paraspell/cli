import { confirm, input, select } from '@inquirer/prompts';

interface PrompterChoice {
  name: string;
  value: string;
}

interface PrompterQuestion {
  type: string;
  name: string;
  message: string;
  initial?: string | boolean;
  choices?: PrompterChoice[];
}

/** Hygen enquirer-shaped API → @inquirer/prompts */
export function createInquirerPrompter() {
  return {
    prompt: async (
      questions: PrompterQuestion | PrompterQuestion[],
    ): Promise<Record<string, unknown>> => {
      const list = Array.isArray(questions) ? questions : [questions];
      const result: Record<string, unknown> = {};
      for (const q of list) {
        if (q.type === 'input') {
          result[q.name] = await input({
            message: q.message,
            default: typeof q.initial === 'string' ? q.initial : undefined,
          });
        } else if (q.type === 'confirm') {
          result[q.name] = await confirm({
            message: q.message,
            default: typeof q.initial === 'boolean' ? q.initial : false,
          });
        } else if (q.type === 'select' && q.choices) {
          result[q.name] = await select({
            message: q.message,
            choices: q.choices.map((c) => ({ name: c.name, value: c.value })),
            default: typeof q.initial === 'string' ? q.initial : undefined,
          });
        }
      }
      return result;
    },
  };
}
