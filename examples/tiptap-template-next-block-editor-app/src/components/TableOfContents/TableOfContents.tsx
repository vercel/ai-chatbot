'use client'

import { Editor as CoreEditor } from '@tiptap/core'
import { memo } from 'react'
import { TableOfContentsStorage } from '@tiptap-pro/extension-table-of-contents'
import { cn } from '@/lib/utils'
import { useEditorState } from '@tiptap/react'

export type TableOfContentsProps = {
  editor: CoreEditor
  onItemClick?: () => void
}

export const TableOfContents = memo(({ editor, onItemClick }: TableOfContentsProps) => {
  const content = useEditorState({
    editor,
    selector: ctx => {
      return (ctx.editor.storage.tableOfContents as TableOfContentsStorage).content
    },
    equalityFn: (a, b) => a === b,
  })

  return (
    <>
      <div className="mb-2 text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
        Table of contents
      </div>
      {content.length > 0 ? (
        <div className="flex flex-col gap-1">
          {content.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              style={{ marginLeft: `${1 * item.level - 1}rem` }}
              onClick={onItemClick}
              className={cn(
                'block font-medium text-neutral-500 dark:text-neutral-300 p-1 rounded bg-opacity-10 text-sm hover:text-neutral-800 transition-all hover:bg-black hover:bg-opacity-5 truncate w-full',
                item.isActive && 'text-neutral-800 bg-neutral-100 dark:text-neutral-100 dark:bg-neutral-900',
              )}
            >
              {item.itemIndex}. {item.textContent}
            </a>
          ))}
        </div>
      ) : (
        <div className="text-sm text-neutral-500">Start adding headlines to your document …</div>
      )}
    </>
  )
})

TableOfContents.displayName = 'TableOfContents'
