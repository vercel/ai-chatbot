import { z } from "zod";
import { startBBSSession, runBrowserStep } from "@/app/stagehand/main";

export function browserAutomationTool({
  dataStream,
  chatId,
  userQuestion,
  onSessionInit,
}: {
  dataStream: any;
  chatId: string;
  userQuestion: string;
  onSessionInit?: (info: {
    sessionId: string;
    debugUrl: string;
    sessionUrl: string;
  }) => void;
}) {
  const inputSchema = z.object({
    instruction: z
      .string()
      .describe(
        "A concrete browsing step (e.g. 'Open Google and search for <query>', 'On this page, find the section that explains X and summarize it').",
      ),
  });

  let sessionPromise:
    | Promise<{ sessionId: string; debugUrl: string; sessionUrl: string }>
    | null = null;

  async function getSession() {
    if (!sessionPromise) {
      sessionPromise = startBBSSession();
      const info = await sessionPromise;

      // Let the route know we have a session (so it can send a final event later)
      if (onSessionInit) {
        onSessionInit(info);
      }

      // Notify client to show live iframe (DevTools)
      dataStream.write({
        type: "data-browser-session",
        data: {
          chatId,
          sessionId: info.sessionId,
          debugUrl: info.debugUrl,
          sessionUrl: info.sessionUrl,
          instruction: userQuestion,
        },
      });

      return info;
    }

    return sessionPromise;
  }

  return {
    description:
      [
        "Use a real browser via Stagehand to browse the web and collect up-to-date information.",
        "Call this for questions that require web research (Google, company sites, Crunchbase, Wikipedia, arXiv, etc.).",
        "You can call this multiple times with different 'instruction' values for multi-step research.",
        "Combine the returned summaries to answer the user’s question.",
      ].join(" "),
    inputSchema,
    async execute(input: z.infer<typeof inputSchema>) {
      const { instruction } = input;

      const { sessionId } = await getSession();
      const { summary } = await runBrowserStep(
        sessionId,
        userQuestion,
        instruction,
      );

      return { summary };
    },
  };
}
