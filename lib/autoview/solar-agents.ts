import { AutoViewAgent } from "@autoview/agent";
import typia from "typia";
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
    api: {
      apiKey: process.env.OPENAI_API_KEY || "********",
    },
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    schema: typia.json.schema<ISolarPanel>(),
  },
  transformFunctionName: "transformSolarPanel",
  experimentalAllInOne: true,
});

// Solar System AutoView Agent
export const solarSystemAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: {
      apiKey: process.env.OPENAI_API_KEY || "********",
    },
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    schema: typia.json.schema<ISolarSystem>(),
  },
  transformFunctionName: "transformSolarSystem",
  experimentalAllInOne: true,
});

// Lead AutoView Agent
export const leadAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: {
      apiKey: process.env.OPENAI_API_KEY || "********",
    },
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    schema: typia.json.schema<ILead>(),
  },
  transformFunctionName: "transformLead",
  experimentalAllInOne: true,
});

// Financial Analysis AutoView Agent
export const financialAnalysisAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: {
      apiKey: process.env.OPENAI_API_KEY || "********",
    },
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    schema: typia.json.schema<IFinancialAnalysis>(),
  },
  transformFunctionName: "transformFinancialAnalysis",
  experimentalAllInOne: true,
});

// Monitoring Data AutoView Agent
export const monitoringDataAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: {
      apiKey: process.env.OPENAI_API_KEY || "********",
    },
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    schema: typia.json.schema<IMonitoringData>(),
  },
  transformFunctionName: "transformMonitoringData",
  experimentalAllInOne: true,
});

// Proposal AutoView Agent
export const proposalAutoViewAgent = new AutoViewAgent({
  model: "chatgpt",
  vendor: {
    api: {
      apiKey: process.env.OPENAI_API_KEY || "********",
    },
    model: "o3-mini",
    isThinkingEnabled: true,
  },
  input: {
    type: "json-schema",
    schema: typia.json.schema<IProposal>(),
  },
  transformFunctionName: "transformProposal",
  experimentalAllInOne: true,
});