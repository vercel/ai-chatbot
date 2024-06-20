import { useMemo } from 'react'
import Image from 'next/image'

import { getYoutubeImageLink } from '@/lib/youtube'

interface ConversionPageProps {
  conversionId: string
  originUrl: string
  modelLabel: string
  sourceAudioLink: string
  convertedAudioLink: string
}

const ConversionPage = ({
  conversionId,
  originUrl,
  modelLabel,
  sourceAudioLink,
  convertedAudioLink
}: ConversionPageProps) => {
  console.log('🚀 ~ convertedAudioLink:', convertedAudioLink)
  console.log('🚀 ~ sourceAudioLink:', sourceAudioLink)
  console.log('🚀 ~ modelLabel:', modelLabel)
  console.log('🚀 ~ originUrl:', originUrl)
  console.log('🚀 ~ conversionId:', conversionId)

  const youtubeImageUrl = useMemo(
    () => getYoutubeImageLink(originUrl),
    [originUrl]
  )

  function renderYoutubeImage() {
    return (
      <div className="relative mb-5 w-full max-w-[850px] md:mb-10">
        <Image
          src={youtubeImageUrl}
          alt="youtube cover"
          sizes="100vw"
          className="h-auto w-full"
          width={0}
          height={0}
        />
      </div>
    )
  }

  return (
    <main className="flex flex-col items-center text-white">
      {youtubeImageUrl && renderYoutubeImage()}

      <h3>Source audio</h3>
      <audio controls>
        <source src={sourceAudioLink} />
      </audio>

      <br />

      <h3>AI {modelLabel} audio</h3>

      <audio controls>
        <source src={convertedAudioLink} />
      </audio>
    </main>
  )
}

export default ConversionPage
