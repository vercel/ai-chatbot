/**
 * @file components/toast.tsx
 * @description Компонент для отображения уведомлений.
 * @version 1.2.0
 * @date 2025-06-06
 * @updated Компонент-обертка теперь экспортирует метод `dismiss` из `sonner` для унификации API.
 */

/** HISTORY:
 * v1.2.0 (2025-06-06): Добавлен экспорт `dismiss` для создания единого API уведомлений.
 * v1.1.0 (2025-06-06): Добавлен тип 'loading' с иконкой LoaderIcon.
 * v1.0.0 (2025-06-06): Начальная версия компонента.
 */
'use client'

import React, { type ReactNode, useEffect, useRef, useState } from 'react'
import { toast as sonnerToast } from 'sonner'
import { CheckCircleFillIcon, LoaderIcon, WarningIcon } from './icons'
import { cn } from '@/lib/utils'

const iconsByType: Record<'success' | 'error' | 'loading', ReactNode> = {
  success: <CheckCircleFillIcon/>,
  error: <WarningIcon/>,
  loading: <LoaderIcon className="animate-spin"/>,
}

// Создаем функцию-обертку
function customToast (props: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast id={id} type={props.type} description={props.description}/>
  ), {
    duration: props.type === 'loading' ? 60000 : 4000,
  })
}

// Прикрепляем метод `dismiss` к нашей функции
customToast.dismiss = sonnerToast.dismiss

// Экспортируем нашу кастомную функцию как `toast`
export { customToast as toast }

function Toast (props: ToastProps) {
  const { id, type, description } = props

  const descriptionRef = useRef<HTMLDivElement>(null)
  const [multiLine, setMultiLine] = useState(false)

  useEffect(() => {
    const el = descriptionRef.current
    if (!el) return

    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight)
      const lines = Math.round(el.scrollHeight / lineHeight)
      setMultiLine(lines > 1)
    }

    update() // initial check
    const ro = new ResizeObserver(update) // re-check on width changes
    ro.observe(el)

    return () => ro.disconnect()
  }, [description])

  return (
    <div className="flex w-full toast-mobile:w-[356px] justify-center">
      <div
        data-testid="toast"
        key={id}
        className={cn(
          'bg-zinc-100 p-3 rounded-lg w-full toast-mobile:w-fit flex flex-row gap-3',
          multiLine ? 'items-start' : 'items-center',
        )}
      >
        <div
          data-type={type}
          className={cn(
            'data-[type=error]:text-red-600 data-[type=success]:text-green-600 data-[type=loading]:text-blue-600',
            { 'pt-1': multiLine },
          )}
        >
          {iconsByType[type]}
        </div>
        <div ref={descriptionRef} className="text-zinc-950 text-sm">
          {description}
        </div>
      </div>
    </div>
  )
}

interface ToastProps {
  id: string | number;
  type: 'success' | 'error' | 'loading';
  description: string;
}

// END OF: components/toast.tsx
