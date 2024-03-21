import { inferActionRegistryInputs } from 'ai-actions'
import { ActionsRegistry } from '.'

type TActionsRegistry = typeof ActionsRegistry

export type TActionId = keyof TActionsRegistry
export type ActionInputs = inferActionRegistryInputs<typeof ActionsRegistry>
