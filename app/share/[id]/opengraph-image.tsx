import { ImageResponse } from 'next/server'

import { getSharedChat } from '@/app/actions'

export const runtime = 'edge'

export const alt = 'AI Chatbot'

export const size = {
  width: 600,
  height: 315
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

  const textAlign = chat?.title?.length > 40 ? 'items-start' : 'items-center'

  return new ImageResponse(
    (
      <div tw="flex w-full items-start h-full flex-col bg-[#09090b] text-white p-[80px]">
        <div tw="flex flex-col w-full pt-[40px]">
          <div tw={`flex w-full ${textAlign}`}>
            <div tw="flex h-18 w-18 items-center justify-center rounded-md border border-[#9b9ba4]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                fill="currentColor"
                width={48}
                height={48}
              >
                <path d="M230.92 212c-15.23-26.33-38.7-45.21-66.09-54.16a72 72 0 1 0-73.66 0c-27.39 8.94-50.86 27.82-66.09 54.16a8 8 0 1 0 13.85 8c18.84-32.56 52.14-52 89.07-52s70.23 19.44 89.07 52a8 8 0 1 0 13.85-8ZM72 96a56 56 0 1 1 56 56 56.06 56.06 0 0 1-56-56Z"></path>
              </svg>
            </div>
            <div tw="flex text-white font-bold text-4xl leading-normal ml-10">
              {chat.title.length > 120
                ? `${chat.title.slice(0, 120)}...`
                : chat.title}
            </div>
          </div>
          <div tw="flex w-full mt-14 items-start">
            <div tw="flex h-18 w-18 items-center justify-center rounded-md border border-[#9b9ba4]">
              <svg
                fill="currentColor"
                viewBox="0 0 24 24"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                width={48}
                height={48}
              >
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
              </svg>
            </div>
            <div tw="flex text-white font-bold text-6xl leading-none ml-10">
              ...
            </div>
          </div>
        </div>
        <div tw="flex items-center justify-between w-full mt-auto">
          <div tw="flex items-center">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="#9b9ba4"
              width={40}
              height={40}
            >
              <path d="M24 22.525H0l12-21.05 12 21.05z" />
            </svg>
            <div tw="flex text-[1.8rem] ml-4 text-[#9b9ba4]">
              Built with{' '}
              <div tw="flex text-[#eaeaf0] ml-2 mr-2">Vercel AI SDK</div> &
              <div tw="flex text-[#eaeaf0] ml-2">KV</div>
            </div>
          </div>
          <div tw="text-[1.8rem] ml-auto text-[#9b9ba4]">
            demo.chat.vercel.ai
          </div>
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
