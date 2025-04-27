import { Extension, NodeViewWrapper, NodeViewWrapperProps } from '@tiptap/react'
import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuid } from 'uuid'
import { ImageOptions } from '@tiptap-pro/extension-ai'

import * as Dropdown from '@radix-ui/react-dropdown-menu'

import { Button } from '@/components/ui/Button'
import { Loader } from '@/components/ui/Loader'
import { Panel, PanelHeadline } from '@/components/ui/Panel'
import { Textarea } from '@/components/ui/Textarea'
import { Icon } from '@/components/ui/Icon'
import { Surface } from '@/components/ui/Surface'
import { DropdownButton } from '@/components/ui/Dropdown'
import { Toolbar } from '@/components/ui/Toolbar'

const imageStyles = [
  { name: 'photorealistic', label: 'Photorealistic', value: 'photorealistic' },
  { name: 'digital-art', label: 'Digital art', value: 'digital_art' },
  { name: 'comic-book', label: 'Comic book', value: 'comic_book' },
  { name: 'neon-punk', label: 'Neon punk', value: 'neon_punk' },
  { name: 'isometric', label: 'Isometric', value: 'isometric' },
  { name: 'line-art', label: 'Line art', value: 'line_art' },
  { name: '3d-model', label: '3D model', value: '3d_model' },
]

interface Data {
  text: string
  imageStyle?: ImageOptions
}

export const AiImageView = ({ editor, node, getPos, deleteNode }: NodeViewWrapperProps) => {
  const aiOptions = editor.extensionManager.extensions.find((ext: Extension) => ext.name === 'ai').options

  const [data, setData] = useState<Data>({
    text: '',
    imageStyle: undefined,
  })
  const currentImageStyle = imageStyles.find(t => t.value === data.imageStyle)
  const [previewImage, setPreviewImage] = useState<string | undefined>(undefined)
  const [isFetching, setIsFetching] = useState(false)
  const textareaId = useMemo(() => uuid(), [])

  const generateImage = useCallback(async () => {
    if (!data.text) {
      toast.error('Please enter a description for the image')

      return
    }

    setIsFetching(true)

    const payload = {
      text: data.text,
      style: data.imageStyle,
    }

    try {
      const { baseUrl, appId, token } = aiOptions
      const response = await fetch(`${baseUrl}/image/prompt`, {
        method: 'POST',
        headers: {
          accept: 'application.json',
          'Content-Type': 'application/json',
          'X-App-Id': appId.trim(),
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await response.json()
      const url = json.response

      if (!url.length) {
        return
      }

      setPreviewImage(url)

      setIsFetching(false)
    } catch (errPayload: any) {
      const errorMessage = errPayload?.response?.data?.error
      const message = errorMessage !== 'An error occurred' ? `An error has occured: ${errorMessage}` : errorMessage

      setIsFetching(false)
      toast.error(message)
    }
  }, [data, aiOptions])

  const insert = useCallback(() => {
    if (!previewImage?.length) {
      return
    }

    editor
      .chain()
      .insertContent(`<img src="${previewImage}" alt="" />`)
      .deleteRange({ from: getPos(), to: getPos() })
      .focus()
      .run()

    setIsFetching(false)
  }, [editor, previewImage, getPos])

  const discard = useCallback(() => {
    deleteNode()
  }, [deleteNode])

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => setData(prevData => ({ ...prevData, text: e.target.value })),
    [],
  )

  const onUndoClick = useCallback(() => {
    setData(prevData => ({ ...prevData, imageStyle: undefined }))
    setPreviewImage(undefined)
  }, [])

  const createItemClickHandler = useCallback((style: { name: string; label: string; value: string }) => {
    return () => setData(prevData => ({ ...prevData, imageStyle: style.value as ImageOptions }))
  }, [])

  return (
    <NodeViewWrapper data-drag-handle>
      <Panel noShadow className="w-full">
        <div className="flex flex-col p-1">
          {isFetching && <Loader label="AI is now doing its job!" />}
          {previewImage && (
            <>
              <PanelHeadline>Preview</PanelHeadline>
              <div
                className="w-full mb-4 bg-white bg-center bg-no-repeat bg-contain border border-black rounded dark:border-neutral-700 aspect-square"
                style={{ backgroundImage: `url(${previewImage})` }}
              />
            </>
          )}
          <div className="flex items-center justify-between gap-2 row">
            <PanelHeadline asChild>
              <label htmlFor={textareaId}>Prompt</label>
            </PanelHeadline>
          </div>
          <Textarea
            id={textareaId}
            value={data.text}
            onChange={handleTextareaChange}
            placeholder={`Describe the image that you want me to generate.`}
            required
            className="mb-2"
          />
          <div className="flex flex-row items-center justify-between gap-1">
            <div className="flex justify-between w-auto gap-1">
              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <Button variant="tertiary">
                    <Icon name="Image" />
                    {currentImageStyle?.label || 'Image style'}
                    <Icon name="ChevronDown" />
                  </Button>
                </Dropdown.Trigger>
                <Dropdown.Portal>
                  <Dropdown.Content side="bottom" align="start" asChild>
                    <Surface className="p-2 min-w-[12rem]">
                      {!!data.imageStyle && (
                        <>
                          <DropdownButton isActive={data.imageStyle === undefined} onClick={onUndoClick}>
                            <Icon name="Undo2" />
                            Reset
                          </DropdownButton>
                          <Toolbar.Divider horizontal />
                        </>
                      )}
                      {imageStyles.map(style => (
                        <DropdownButton
                          isActive={style.value === data.imageStyle}
                          key={style.value}
                          onClick={createItemClickHandler(style)}
                        >
                          {style.label}
                        </DropdownButton>
                      ))}
                    </Surface>
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            </div>
            <div className="flex flex-row items-center justify-between gap-1">
              {previewImage && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                  onClick={discard}
                >
                  <Icon name="Trash" />
                  Discard
                </Button>
              )}
              {previewImage && (
                <Button variant="ghost" onClick={insert}>
                  <Icon name="Check" />
                  Insert
                </Button>
              )}
              <Button variant="primary" onClick={generateImage}>
                {previewImage ? <Icon name="Repeat" /> : <Icon name="Sparkles" />}
                {previewImage ? 'Regenerate' : 'Generate image'}
              </Button>
            </div>
          </div>
        </div>
      </Panel>
    </NodeViewWrapper>
  )
}
