'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconTrash } from '@/components/ui/icons'
import { CounterClockwiseClockIcon } from '@radix-ui/react-icons'
import { KeyboardEvent, useCallback, useEffect, useState } from 'react'
import useLocalStorageState from 'use-local-storage-state'
import { listHistory, setHistory as setHistoryRemote } from './history-storage'

const MAX_HISTORY_LENGTH = 5

export const useInputHistory = ({
  value,
  setValue,
  inputRef,
  useRemoteStorage
}: {
  value: string
  setValue: (value: string) => void
  inputRef: React.RefObject<HTMLTextAreaElement>
  useRemoteStorage?: boolean
}) => {
  const remoteHistory = useRemoteHistoryState()
  const localHistory = useLocalStorageState<string[]>('history', {
    defaultValue: []
  })
  const [history, setHistory] = useRemoteStorage ? remoteHistory : localHistory
  const [historyIndex, setHistoryIndex] = useState<undefined | number>(
    undefined
  )
  const [prevValue, setPrevValue] = useState('')
  const [open, setOpen] = useState(false)

  const onKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (history.length <= 0) {
        return
      }

      if (e.code === 'ArrowUp') {
        if (historyIndex === undefined) {
          setPrevValue(value)
        } else if (historyIndex <= 0) {
          return
        }

        const newHistoryIndex =
          historyIndex === undefined ? history.length - 1 : historyIndex - 1

        setValue(history[newHistoryIndex])
        setHistoryIndex(newHistoryIndex)
      } else if (e.code === 'ArrowDown') {
        if (historyIndex === undefined) {
          return
        }

        const newHistoryIndex =
          historyIndex === history.length - 1 ? undefined : historyIndex + 1

        setValue(
          newHistoryIndex === undefined ? prevValue : history[newHistoryIndex]
        )
        setHistoryIndex(newHistoryIndex)
      }
    },
    [history, historyIndex, prevValue, setHistoryIndex, setValue, value]
  )

  const onSubmit = useCallback(() => {
    let currentValue = value.trim()

    if (currentValue && !history.includes(currentValue)) {
      if (history.length >= MAX_HISTORY_LENGTH) {
        setHistory([...history.slice(1), currentValue])
      } else {
        setHistory([...history, currentValue])
      }
    }
    setHistoryIndex(undefined)
    setPrevValue('')
  }, [history, setHistory, setHistoryIndex, setPrevValue, value])

  return {
    onKeyUp,
    onSubmit,
    button:
      history.length > 0 ? (
        <div className="flex items-center justify-center p-4">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full bg-background p-0"
              >
                <CounterClockwiseClockIcon />
                <span className="sr-only">History</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My history</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {history.map((historyValue, i) => (
                  <DropdownMenuItem
                    key={i}
                    onSelect={() => {
                      setValue(historyValue)

                      // Focus on input after selecting history
                      // This is a workaround for the dropdown menu
                      setTimeout(() => {
                        inputRef.current?.focus()
                      }, 500)
                    }}
                  >
                    <span>{historyValue}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    setHistory([])
                  }}
                >
                  <IconTrash className="mr-2 size-4" /> Clear history
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null
  }
}

const useRemoteHistoryState = () => {
  const [history, setHistory] = useState<string[]>([])
  useEffect(() => {
    const run = async () => {
      setHistory(await listHistory())
    }
    run()
  }, [])
  const setBothHistory = useCallback((values: string[]) => {
    setHistoryRemote(values)
    setHistory(values)
  }, [])
  return [history, setBothHistory] as const
}
