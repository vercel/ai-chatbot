import { cn } from '@/lib/utils'
import { useCallback } from 'react'

export type ToggleProps = {
  active?: boolean
  onChange: (active: boolean) => void
  size?: 'small' | 'large'
}

export const Toggle = ({ onChange, active = false, size = 'large' }: ToggleProps) => {
  const state = active ? 'checked' : 'unchecked'
  const value = active ? 'on' : 'off'

  const buttonClass = cn(
    'inline-flex cursor-pointer items-center rounded-full border-transparent transition-colors',
    !active ? 'bg-neutral-200 hover:bg-neutral-300' : 'bg-black',
    !active ? 'dark:bg-neutral-800 dark:hover:bg-neutral-700' : 'dark:bg-white',
    size === 'small' && 'h-3 w-6 px-0.5',
    size === 'large' && 'h-5 w-9 px-0.5',
  )

  const pinClass = cn(
    'rounded-full pointer-events-none block transition-transform',
    'bg-white dark:bg-black',
    size === 'small' && 'h-2 w-2',
    size === 'large' && 'h-4 w-4',
    active ? cn(size === 'small' ? 'translate-x-3' : '', size === 'large' ? 'translate-x-4' : '') : 'translate-x-0',
  )

  const handleChange = useCallback(() => {
    onChange(!active)
  }, [active, onChange])

  return (
    <button
      className={buttonClass}
      type="button"
      role="switch"
      aria-checked={active}
      data-state={state}
      value={value}
      onClick={handleChange}
    >
      <span className={pinClass} data-state={state} />
    </button>
  )
}
