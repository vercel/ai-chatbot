import { createPortal } from 'react-dom'

import { LoaderProps, LoadingWrapperProps } from './types'

const LoadingWrapper = ({ label }: LoadingWrapperProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 text-white bg-black rounded-lg shadow-2xl dark:text-black dark:bg-white">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-8 h-8 animate-spin"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {label && <p className="text-sm font-semibold leading-tight text-white dark:text-black">{label}</p>}
    </div>
  )
}

export const Loader = ({ hasOverlay = true, label }: LoaderProps) => {
  return hasOverlay ? (
    createPortal(
      <div className="items-center justify-center bg-black/60 flex h-full w-full fixed top-0 left-0 select-none z-[9999]">
        <LoadingWrapper label={label} />
      </div>,
      document.body,
    )
  ) : (
    <LoadingWrapper label={label} />
  )
}

export default Loader
