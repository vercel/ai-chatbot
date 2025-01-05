import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

let handler: WebWorkerMLCEngineHandler;

self.addEventListener("message", (event) => {});

self.onmessage = (msg: MessageEvent) => {
  if (!handler) {
    handler = new WebWorkerMLCEngineHandler();
    console.log("Web Worker: Web-LLM Engine Activated");
  }
  handler.onmessage(msg);
};
