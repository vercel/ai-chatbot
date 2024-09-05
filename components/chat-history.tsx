"use client"
import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarList } from '@/components/sidebar-list'
import { useClass } from '@/lib/hooks/classContext'

const classTypes = [
  {
    name: 'Identify important people and places in a hospital',
    vocabulary: [
      'medical',
      'doctor (Dr.)',
      'nurse',
      'surgeon',
      'operating room (OR)',
      'emergency department (ED)'
    ],
    description: 'Lesson #1: Identify important people and places in a hospital'
  },
  {
    name: 'Describe safety procedures',
    vocabulary: [
      'gloves',
      'washing hands',
      'mask',
      'gown',
      'isolation',
      'to disinfect'
    ],
    description: 'Lesson #2: Describe safety procedures'
  },
  {
    name: 'Communicate a patient’s vital signs with the medical team',
    vocabulary: [
      'weight',
      'temperature',
      'pulse',
      'blood pressure',
      'vital signs',
      'to measure'
    ],
    description: 'Lesson #3: Communicate a patient’s vital signs with the medical team'
  },
  {
    name: 'Ask about a patient’s medical history',
    vocabulary: [
      'medical history',
      'illness',
      'surgery',
      'habits',
      'allergy',
      'medication'
    ],
    description: 'Lesson #4: Ask about a patient’s medical history'
  },
  {
    name: 'Talk to a patient after an accident',
    vocabulary: [
      'hurt',
      'pain',
      'bone',
      'fracture',
      'sprain',
      'treatment'
    ],
    description: 'Lesson #5: Talk to a patient after an accident'
  }
]

interface ChatHistoryProps {
  userId?: string
}

export function ChatHistory({ userId }: ChatHistoryProps) {
  const { selectedClass, setSelectedClass } = useClass()

  const handleClassSelect = (className: string) => {
    setSelectedClass(className)
    console.log(`Selected class: ${className}`)
  }


  return (
    <div className="flex flex-col h-full">
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
                selectedClass === classType.name ? 'bg-blue-200 dark:bg-blue-700' : ''
              )}
            >
              <span className="text-base font-medium">
                {classType.name}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {classType.description}
              </p>
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
        {/* @ts-ignore */}
        <SidebarList userId={userId} />
      </React.Suspense>
    </div>
  )
}