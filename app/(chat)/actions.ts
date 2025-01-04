"use server";

import { type CoreUserMessage, generateText } from "ai";
import { cookies } from "next/headers";

import { customModel } from "@/lib/ai";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";
import { VisibilityType } from "@/components/visibility-selector";
import { Model } from "@/lib/ai/models";

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("model-id", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: customModel("gpt-4o-mini"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

type ComparisonSymbolObject = {
  symbol: string;
  position: "SameScale";
};

export async function generateCaption(
  symbol: string,
  comparisonSymbols: ComparisonSymbolObject[],
  toolName: string,
  model: Model
): Promise<string> {
  const stockString =
    comparisonSymbols.length === 0
      ? symbol
      : [symbol, ...comparisonSymbols.map((obj) => obj.symbol)].join(", ");

  const captionSystemMessage =
    `\
You are a stock market conversation bot. You can provide the user information about stocks include prices and charts in the UI. You do not have access to any information and should only provide information by calling functions.

These are the tools you have available:
1. showStockFinancials
This tool shows the financials for a given stock.

2. showStockChart
This tool shows a stock chart for a given stock or currency. Optionally compare 2 or more tickers.

3. showStockPrice
This tool shows the price of a stock or currency.

4. showStockNews
This tool shows the latest news and events for a stock or cryptocurrency.

5. showStockScreener
This tool shows a generic stock screener which can be used to find new stocks based on financial or technical parameters.

6. showMarketOverview
This tool shows an overview of today's stock, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.

7. showMarketHeatmap
This tool shows a heatmap of today's stock market performance across sectors.

8. showTrendingStocks
This tool shows the daily top trending stocks including the top five gaining, losing, and most active stocks based on today's performance.

9. showETFHeatmap
This tool shows a heatmap of today's ETF market performance across sectors and asset classes.


You have just called a tool (` +
    toolName +
    ` for ` +
    stockString +
    `) to respond to the user. Now generate text to go alongside that tool response, which may be a graphic like a chart or price history.
  
Example:

User: What is the price of AAPL?
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "AAPL" } } } 

Assistant (you): The price of AAPL stock is provided above. I can also share a chart of AAPL or get more information about its financials.

or

Assistant (you): This is the price of AAPL stock. I can also generate a chart or share further financial data.

or 
Assistant (you): Would you like to see a chart of AAPL or get more information about its financials?

Example 2 :

User: Compare AAPL and MSFT stock prices
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockChart" }, "parameters": { "symbol": "AAPL" , "comparisonSymbols" : [{"symbol": "MSFT", "position": "SameScale"}] } } } 

Assistant (you): The chart illustrates the recent price movements of Microsoft (MSFT) and Apple (AAPL) stocks. Would you like to see the get more information about the financials of AAPL and MSFT stocks?
or

Assistant (you): This is the chart for AAPL and MSFT stocks. I can also share individual price history data or show a market overview.

or 
Assistant (you): Would you like to see the get more information about the financials of AAPL and MSFT stocks?

## Guidelines
Talk like one of the above responses, but BE CREATIVE and generate a DIVERSE response. 

Your response should be BRIEF, about 2-3 sentences.

Besides the symbol, you cannot customize any of the screeners or graphics. Do not tell the user that you can.
    `;

  try {
    const response = await generateText({
      model: customModel(model.apiIdentifier),
      messages: [
        {
          role: "system",
          content: captionSystemMessage,
        },
      ],
    });
    return response.text || "";
  } catch (err) {
    return ""; // Send tool use without caption.
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
