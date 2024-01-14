import { JSONValue } from 'ai'
import { Markdown } from './markdown'

export interface DataViewProps extends React.ComponentProps<'div'> {
  data: JSONValue | undefined
  content: string
}

export function DataView(message: DataViewProps) {
  const { data, content } = message

  if ((data as any)?.[0] != null) {
    const value = (data as any)?.[0] as any

    switch (value.type) {
      case 'weather': {
        return (
          <div className="p-6 text-white bg-gray-500 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{value.location}</h2>
              <svg
                className="w-8 h-8 "
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            </div>
            <p className="mt-2 text-4xl font-semibold">
              {value.temperature}° {value.format}
            </p>
          </div>
        )
      }

      case 'image': {
        return (
          <div className="border-8 border-[#8B4513] dark:border-[#5D2E1F] rounded-lg overflow-hidden">
            <img
              alt="Framed Image"
              className="object-cover w-full aspect-square"
              height="500"
              src={value.url}
              width="500"
            />
          </div>
        )
      }
    }
  }

  return <Markdown>{content}</Markdown>
}
