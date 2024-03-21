import { getEventsAction } from './_actions/get-events'
import { listStocksAction } from './_actions/list-stocks'
import { showStockPriceAction } from './_actions/show-stock-price'
import { showStockPurchaseAction } from './_actions/show-stock-purchase'
import { createAIChatbotActionsRegistry } from './genarators'

const ActionsRegistry = createAIChatbotActionsRegistry([
  getEventsAction,
  listStocksAction,
  showStockPriceAction,
  showStockPurchaseAction
])

export { ActionsRegistry }
