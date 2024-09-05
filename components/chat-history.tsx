'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { SidebarList } from '@/components/sidebar-list'
import { useClass } from '@/lib/hooks/classContext'
import classTypes from '@/public/data/classTypes'

interface ChatHistoryProps {}

export function ChatHistory({}: ChatHistoryProps) {
  const { selectedClass, setSelectedClass } = useClass()

  const handleClassSelect = (className: string) => {
    setSelectedClass(className)
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex items-center justify-between p-4">
        <h4 className="text-sm font-medium">Lesson Options</h4>
      </div>

      {/* Scrollable Class Types Section */}
      <div className="mb-2 px-4 flex-1 overflow-auto">
        <ul className="space-y-2 mt-2">
          {classTypes.map((classType, index) => (
            <li
              key={index}
              onClick={() => handleClassSelect(classType.name)}
              className={cn(
                'p-2 border border-zinc-200 rounded-md cursor-pointer dark:border-zinc-700 dark:bg-zinc-800',
                selectedClass === classType.name
                  ? 'bg-blue-200 dark:bg-blue-700'
                  : ''
              )}
            >
              <span className="text-base font-medium">
                {classType.description}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <React.Suspense
        fallback={
          <div className="flex flex-col flex-1 px-4 space-y-4 overflow-auto">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-6 rounded-md shrink-0 animate-pulse bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        }
      >
        <SidebarList />
      </React.Suspense>
    </div>
  )
}
