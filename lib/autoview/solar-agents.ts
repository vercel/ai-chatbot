import { AutoViewAgent } from "@autoview/agent";
import OpenAI from "openai";
import {
  ISolarPanel,
  ISolarSystem,
  ILead,
  IFinancialAnalysis,
  IMonitoringData,
  IProposal
} from "./solar-types";

// Solar Panel AutoView Agent
export const solarPanelAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<ISolarPanel>(),
  },
  transformFunctionName: "transformSolarPanel",
  experimentalAllInOne: true,
});

// Solar System AutoView Agent
export const solarSystemAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<ISolarSystem>(),
  },
  transformFunctionName: "transformSolarSystem",
  experimentalAllInOne: true,
});

// Lead AutoView Agent
export const leadAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<ILead>(),
  },
  transformFunctionName: "transformLead",
  experimentalAllInOne: true,
});

// Financial Analysis AutoView Agent
export const financialAnalysisAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<IFinancialAnalysis>(),
  },
  transformFunctionName: "transformFinancialAnalysis",
  experimentalAllInOne: true,
});

// Monitoring Data AutoView Agent
export const monitoringDataAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<IMonitoringData>(),
  },
  transformFunctionName: "transformMonitoringData",
  experimentalAllInOne: true,
});

// Proposal AutoView Agent
export const proposalAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    unit: typia.json.unit<IProposal>(),
  },
  transformFunctionName: "transformProposal",
  experimentalAllInOne: true,
});