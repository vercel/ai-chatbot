// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/models/model-select.tsx

import { useAppContext } from '@/lib/hooks/use-app-context'
import { LLM, LLMID } from '@/types'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { FC, useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import { ModelIcon } from './model-icon'
import { ModelOption } from './model-option'

interface ModelSelectProps {
  selectedModelId: string
  onSelectModel: (modelId: LLMID) => void
}

export const ModelSelect: FC<ModelSelectProps> = ({
  selectedModelId,
  onSelectModel
}) => {
  const { availableHostedModels, availableOpenRouterModels } = useAppContext()

  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100) // FIX: hacky
    }
  }, [isOpen])

  const handleSelectModel = (modelId: LLMID) => {
    onSelectModel(modelId)
    setIsOpen(false)
  }

  const allModels = [...availableHostedModels, ...availableOpenRouterModels]

  const groupedModels = allModels.reduce<Record<string, LLM[]>>(
    (groups, model) => {
      const key = model.provider
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(model)
      return groups
    },
    {}
  )

  const selectedModel = allModels.find(
    model => model.modelId === selectedModelId
  )

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={isOpen => {
        setIsOpen(isOpen)
        setSearch('')
      }}
    >
      <DropdownMenuTrigger
        className="bg-background w-full justify-start border-2 px-3 py-5"
        asChild
        disabled={allModels.length === 0}
      >
        <Button
          ref={triggerRef}
          className="flex items-center justify-between"
          variant="ghost"
        >
          <div className="flex items-center">
            {selectedModel ? (
              <>
                <ModelIcon
                  provider={selectedModel?.provider}
                  width={26}
                  height={26}
                />
                <div className="ml-2 flex items-center">
                  {selectedModel?.modelName}
                </div>
              </>
            ) : (
              <div className="flex items-center">Select a model</div>
            )}
          </div>

          <IconChevronDown />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="space-y-2 overflow-auto p-2"
        style={{ width: triggerRef.current?.offsetWidth }}
        align="start"
      >
        <Input
          ref={inputRef}
          className="w-full"
          placeholder="Search models..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="max-h-[300px] overflow-auto">
          {Object.entries(groupedModels).map(([provider, models]) => {
            const filteredModels = models
              .filter(model =>
                model.modelName.toLowerCase().includes(search.toLowerCase())
              )
              .sort((a, b) => a.provider.localeCompare(b.provider))

            if (filteredModels.length === 0) return null

            return (
              <div key={provider}>
                <div className="mb-1 ml-2 text-xs font-bold tracking-wide opacity-50">
                  {provider.toLocaleUpperCase()}
                </div>

                <div className="mb-4">
                  {filteredModels.map(model => {
                    return (
                      <div
                        key={model.modelId}
                        className="flex items-center space-x-1"
                      >
                        {selectedModelId === model.modelId && (
                          <IconCheck className="ml-2" size={32} />
                        )}

                        <ModelOption
                          key={model.modelId}
                          model={model}
                          onSelect={() => handleSelectModel(model.modelId)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
