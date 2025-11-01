"use server";

import { getchatmodels } from "@/lib/ai/models";

export async function getavailablemodels() {
  const models = await getchatmodels();
  return models;
}
