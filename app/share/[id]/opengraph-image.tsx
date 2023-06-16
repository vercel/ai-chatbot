import { ImageResponse } from 'next/server'

import { getSharedChat } from '@/app/actions'
import { formatDate } from '@/lib/utils'

export const runtime = 'edge'

export const alt = 'AI Chatbot'
export const size = {
  width: 1200,
  height: 630
}

export const contentType = 'image/png'

const interRegular = fetch(
  new URL('../../../assets/fonts/Inter-Regular.ttf', import.meta.url)
).then(res => res.arrayBuffer())

const interBold = fetch(
  new URL('../../../assets/fonts/Inter-Bold.ttf', import.meta.url)
).then(res => res.arrayBuffer())

interface ImageProps {
  params: {
    id: string
  }
}

export default async function Image({ params }: ImageProps) {
  const chat = await getSharedChat(params.id)

  if (!chat || !chat?.sharePath) {
    return null
  }

  return new ImageResponse(
    (
      <div tw="flex w-full items-start h-full flex-col bg-black text-white py-[120px] px-[80px]">
        <div tw="flex flex-col">
          <div tw="flex text-white font-bold text-5xl leading-tight truncate line-clamp-3">
            {chat.title.length > 120
              ? `${chat.title.slice(0, 120)}...`
              : chat.title}
          </div>
          <div tw="flex text-zinc-400 text-2xl mt-4">
            {formatDate(chat.createdAt)} · {chat.messages.length} messages
          </div>
        </div>
        <div tw="flex items-center justify-between w-full mt-auto">
          <div tw="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0"
              y="0"
              version="1.1"
              viewBox="0 0 33 33"
              width={40}
              height={40}
            >
              <path
                d="M5 .5h20c2.5 0 4.5 2 4.5 4.5v20c0 2.5-2 4.5-4.5 4.5H5c-2.5 0-4.5-2-4.5-4.5V5C.5 2.5 2.5.5 5 .5z"
                fill="black"
              />
              <circle
                cx="17.5"
                cy="21.5"
                r="4.5"
                fill="transparent"
                strokeWidth="1.15"
                stroke="white"
              />
              <path
                d="m18.2 4.8 6.4 1.6c.3.1.4.3.4.6l-1.6 6.4c-.1.3-.3.4-.6.4l-6.4-1.6c-.3-.1-.4-.3-.4-.6l1.6-6.4c0-.3.3-.5.6-.4zM7 9c.1-.4.5-.5.8-.3l6.6 5.6c.3.2.2.7-.2.9l-8.1 3c-.4.1-.7-.2-.7-.6L7 9z"
                fill="transparent"
                strokeWidth="1.15"
                stroke="white"
              />
              <path
                d="M17.7 18.3v11.3c0 1.3 3.2 2.4 7.3 2.4s7.3-1.1 7.3-2.4V18.3"
                fill="black"
              />
              <path
                d="M17.7 18.3c0-1.3 3.3-2.4 7.3-2.4s7.3 1.1 7.3 2.4v11.3c0 1.3-3.2 2.4-7.3 2.4s-7.3-1.1-7.3-2.4V18.3z"
                fill="black"
              />
              <path
                fill="none"
                stroke="white"
                d="M5 .5h20c2.5 0 4.5 2 4.5 4.5v20c0 2.5-2 4.5-4.5 4.5H5c-2.5 0-4.5-2-4.5-4.5V5C.5 2.5 2.5.5 5 .5z"
              />
              <path
                fill="black"
                stroke="white"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.25"
                d="M32.3 18.3c0 1.3-3.3 2.4-7.3 2.4s-7.3-1.1-7.3-2.4m14.6 0c0-1.3-3.3-2.4-7.3-2.4s-7.3 1.1-7.3 2.4m14.6 0v11.3c0 1.3-3.2 2.4-7.3 2.4s-7.3-1.1-7.3-2.4V18.3M32.3 24c0 1.3-3.2 2.4-7.3 2.4s-7.3-1.1-7.3-2.4"
              />
            </svg>
            <div tw="text-2xl ml-4 text-zinc-300">Built with Vercel KV</div>
          </div>
          <svg
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={40}
            height={40}
          >
            <defs>
              <linearGradient
                id="gradient-1"
                x1="10.6889"
                y1="10.3556"
                x2="13.8445"
                y2="14.2667"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="black" />
                <stop offset={1} stopColor="black" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="gradient-2"
                x1="11.7555"
                y1="4.8"
                x2="11.7376"
                y2="9.50002"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="black" />
                <stop offset={1} stopColor="black" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d="M1 16L2.58314 11.2506C1.83084 9.74642 1.63835 8.02363 2.04013 6.39052C2.4419 4.75741 3.41171 3.32057 4.776 2.33712C6.1403 1.35367 7.81003 0.887808 9.4864 1.02289C11.1628 1.15798 12.7364 1.8852 13.9256 3.07442C15.1148 4.26363 15.842 5.83723 15.9771 7.5136C16.1122 9.18997 15.6463 10.8597 14.6629 12.224C13.6794 13.5883 12.2426 14.5581 10.6095 14.9599C8.97637 15.3616 7.25358 15.1692 5.74942 14.4169L1 16Z"
              fill="white"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <mask
              id="mask0_91_2047"
              style={{ maskType: 'alpha' }}
              maskUnits="userSpaceOnUse"
              x={1}
              y={0}
              width={16}
              height={16}
            >
              <circle cx={9} cy={8} r={8} fill="white" />
            </mask>
            <g mask="url(#mask0_91_2047)">
              <circle cx={9} cy={8} r={8} fill="white" />
              <path
                d="M14.2896 14.0018L7.146 4.8H5.80005V11.1973H6.87681V6.16743L13.4444 14.6529C13.7407 14.4545 14.0231 14.2369 14.2896 14.0018Z"
                fill={`url(#gradient-1)`}
              />
              <rect
                x="11.2222"
                y="4.8"
                width="1.06667"
                height="6.4"
                fill={`url(#gradient-2)`}
              />
            </g>
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: await interRegular,
          style: 'normal',
          weight: 400
        },
        {
          name: 'Inter',
          data: await interBold,
          style: 'normal',
          weight: 700
        }
      ]
    }
  )
}
