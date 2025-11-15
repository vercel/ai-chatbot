"use server";

import { Stagehand } from "@browserbasehq/stagehand";
import { Browserbase } from "@browserbasehq/sdk";
import { z } from "zod"; 

// Main Stagehand script – parameterized by a natural-language instruction
async function main(stagehand: Stagehand, instruction: string) {
  // get the first page from the context
  const page = stagehand.context.pages()[0];

  // Navigate to a starting URL
  await page.goto("https://www.google.com");

  if (instruction.trim().length > 0) {
    // act is on the stagehand instance, with optional { page }
    await stagehand.act(instruction, { page });
  }

  // extract is also on the stagehand instance
  const { title } = await stagehand.extract(
    "extract the main heading or title of the page",
    z.object({
      title: z.string(),
    }),
  );

  return { title };
}

/**
 * Initialize and run the main() function
 */
export async function runStagehand(sessionId: string, instruction: string) {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    verbose: 1,
    logger: console.log,
    browserbaseSessionID: sessionId,
    disablePino: true,
  });

  await stagehand.init();
  const result = await main(stagehand, instruction);
  await stagehand.close();

  return result;
}

/**
 * Start a Browserbase session and return the sessionId + fullscreen debugger URL
 */
export async function startBBSSession() {
  const browserbase = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
  });

  const session = await browserbase.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  const debug = await browserbase.sessions.debug(session.id);

  return {
    sessionId: session.id,
    debugUrl: debug.debuggerFullscreenUrl,
  };
}
