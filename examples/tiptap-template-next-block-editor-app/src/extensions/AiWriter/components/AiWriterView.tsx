import { NodeViewProps, NodeViewWrapper, useEditorState } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuid } from 'uuid'

import { Button } from '@/components/ui/Button'
import { Panel, PanelHeadline } from '@/components/ui/Panel'
import { Textarea } from '@/components/ui/Textarea'
import { Icon } from '@/components/ui/Icon'

import { AiTone, AiToneOption } from '@/components/BlockEditor/types'
import { tones } from '@/lib/constants'

import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Toolbar } from '@/components/ui/Toolbar'
import { Surface } from '@/components/ui/Surface'
import { DropdownButton } from '@/components/ui/Dropdown'
import { AiStorage, tryParseToTiptapHTML } from '@/extensions/Ai/index'

export interface DataProps {
  text: string
  tone?: AiTone
  textUnit?: string
  textLength?: string
}

// TODO rewrite this component to use the new Ai extension features
export const AiWriterView = ({ editor, node, getPos, deleteNode }: NodeViewProps) => {
  const { isLoading, generatedText, error } = useEditorState({
    editor,
    selector: ctx => {
      const aiStorage = ctx.editor.storage.ai as AiStorage
      return {
        isLoading: aiStorage.state === 'loading',
        generatedText: aiStorage.response,
        error: aiStorage.error,
      }
    },
  })

  const [data, setData] = useState<DataProps>({
    text: '',
    tone: undefined,
  })
  const currentTone = tones.find(t => t.value === data.tone)
  const textareaId = useMemo(() => uuid(), [])

  const generateText = useCallback(() => {
    if (!data.text) {
      toast.error('Please enter a description')

      return
    }

    editor.commands.aiTextPrompt({
      text: data.text,
      insert: false,
      tone: data.tone,
      stream: true,
      format: 'rich-text',
    })
  }, [data.text, data.tone, editor])

  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  const insert = useCallback(() => {
    const from = getPos()
    const to = from + node.nodeSize
    editor.chain().focus().aiAccept({ insertAt: { from, to }, append: false }).run()
  }, [editor, getPos, node.nodeSize])

  const discard = useCallback(() => {
    deleteNode()
  }, [deleteNode])

  const onTextAreaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setData(prevData => ({ ...prevData, text: e.target.value }))
  }, [])

  const onUndoClick = useCallback(() => {
    setData(prevData => ({ ...prevData, tone: undefined }))
  }, [])

  const createItemClickHandler = useCallback((tone: AiToneOption) => {
    return () => {
      setData(prevData => ({ ...prevData, tone: tone.value }))
    }
  }, [])

  return (
    <NodeViewWrapper data-drag-handle>
      <Panel noShadow className="w-full">
        <div className="flex flex-col p-1">
          {generatedText && (
            <>
              <PanelHeadline>Preview</PanelHeadline>
              <div
                className="bg-white dark:bg-black border-l-4 border-neutral-100 dark:border-neutral-700 text-black dark:text-white text-base max-h-[14rem] mb-4 ml-2.5 overflow-y-auto px-4 relative"
                dangerouslySetInnerHTML={{ __html: tryParseToTiptapHTML(generatedText, editor) ?? '' }}
              />
            </>
          )}
          <div className="flex flex-row items-center justify-between gap-1">
            <PanelHeadline asChild>
              <label htmlFor={textareaId}>Prompt</label>
            </PanelHeadline>
          </div>
          <Textarea
            id={textareaId}
            value={data.text}
            onChange={onTextAreaChange}
            placeholder={'Tell me what you want me to write about.'}
            required
            className="mb-2"
          />
          <div className="flex flex-row items-center justify-between gap-1">
            <div className="flex justify-between w-auto gap-1">
              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <Button variant="tertiary">
                    <Icon name="Mic" />
                    {currentTone?.label || 'Change tone'}
                    <Icon name="ChevronDown" />
                  </Button>
                </Dropdown.Trigger>
                <Dropdown.Portal>
                  <Dropdown.Content side="bottom" align="start" asChild>
                    <Surface className="p-2 min-w-[12rem]">
                      {!!data.tone && (
                        <>
                          <Dropdown.Item asChild>
                            <DropdownButton isActive={data.tone === undefined} onClick={onUndoClick}>
                              <Icon name="Undo2" />
                              Reset
                            </DropdownButton>
                          </Dropdown.Item>
                          <Toolbar.Divider horizontal />
                        </>
                      )}
                      {tones.map(tone => (
                        <Dropdown.Item asChild key={tone.value}>
                          <DropdownButton isActive={tone.value === data.tone} onClick={createItemClickHandler(tone)}>
                            {tone.label}
                          </DropdownButton>
                        </Dropdown.Item>
                      ))}
                    </Surface>
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            </div>
            <div className="flex justify-between w-auto gap-1">
              {generatedText && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={discard}
                >
                  <Icon name="Trash" />
                  Discard
                </Button>
              )}
              {generatedText && (
                <Button variant="ghost" onClick={insert} disabled={!generatedText}>
                  <Icon name="Check" />
                  Insert
                </Button>
              )}
              <Button variant="primary" onClick={generateText} style={{ whiteSpace: 'nowrap' }} disabled={isLoading}>
                {generatedText ? <Icon name="Repeat" /> : <Icon name="Sparkles" />}
                {generatedText ? 'Regenerate' : 'Generate text'}
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </NodeViewWrapper>
  )
}
