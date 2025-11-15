"use server";

import { Stagehand } from "@browserbasehq/stagehand";
import { Browserbase } from "@browserbasehq/sdk";
import { z } from "zod/v3";

export type BrowserStepResult = {
  summary: string;
};

async function runSingleStep(
  stagehand: Stagehand,
  userQuestion: string,
  stepInstruction: string,
): Promise<BrowserStepResult> {
  // Get the first page or create one
  const page = stagehand.context.pages()[0] ?? (await stagehand.context.newPage());

  const currentUrl = page.url();
  if (!currentUrl || currentUrl === "about:blank") {
    // Start with a Google search for the *full* user question
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      userQuestion,
    )}`;
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
    });
  }

  await stagehand.act(
    `
You are using a real web browser to help answer the user's question:

"${userQuestion}"

Your current sub-task is:

"${stepInstruction}"

Starting from the current page:
- Use search results or navigation to find relevant information.
- Click links, scroll, and read content as needed.
- Prefer authoritative sources when possible.
`,
    { page },
  );

  const { summary } = await stagehand.extract(
    `
Summarize ONLY the new facts you just learned that help answer:

"${userQuestion}"

Focus on concrete information (e.g., numbers, trends, dates, key names).
Do not restate everything on the page, just the key points.
If you did not learn anything new, return an empty string.
`,
    z.object({
      summary: z.string(),
    }),
  );

  return { summary };
}

/**
 * Run a generic browser step on a given Browserbase session.
 */
export async function runBrowserStep(
  sessionId: string,
  userQuestion: string,
  stepInstruction: string,
): Promise<BrowserStepResult> {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",

    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,

    model: "openai/gpt-4o",

    browserbaseSessionID: sessionId,
    verbose: 1,
    logger: console.log,
    disablePino: true,
  });

  await stagehand.init();

  try {
    return await runSingleStep(stagehand, userQuestion, stepInstruction);
  } finally {
    await stagehand.close();
  }
} 

/**
 * Start a Browserbase session and return the sessionId + fullscreen debugger URL.
 */
export async function startBBSSession() {
  const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
  });

  const session = await browserbase.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  const debug = await browserbase.sessions.debug(session.id);

  // Browserbase exposes a session page URL; if types don’t include it, fall back to pattern.
  const sessionUrl =
    (session as any).url ??
    `https://www.browserbase.com/sessions/${session.id}`;

  return {
    sessionId: session.id,
    debugUrl: debug.debuggerFullscreenUrl,
    sessionUrl,
  };
}