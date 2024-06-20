const apiKey = process.env.YOUTUBE_API_KEY

export const extractYouTubeVideoIdFromUrl = (url: string) => {
  // regex pattern to look for a youTube ID
  const regExp =
    /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
  //Match the url with the regex
  const match = url.match(regExp)
  //Return the result
  return match && match[1].length === 11 ? match[1] : undefined
}

export const isValidYoutubeUrl = (url: string) => {
  const youtubeRegex =
    /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|live\/|shorts\/|v\/)?)([\w\-]+)(\S+)?$/

  return youtubeRegex.test(url)
}

export const fetchYoutubeDuration = async (
  videoId: string
): Promise<{ durationInSeconds: number }> => {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`

  const res = await fetch(apiUrl)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Api request failed`)
  }

  let durationInSeconds = 0

  // Check if the response contains items
  if (data.items && data.items.length > 0) {
    // Extract duration from the response
    const duration = data.items[0].contentDetails.duration

    // Convert YouTube's duration format (e.g., PT1H30M15S) to seconds
    durationInSeconds = parseYouTubeDuration(duration)
  } else {
    throw new Error(`Unable to get youtube duration`)
  }

  return { durationInSeconds }
}

export const getYoutubeImageLink = (url: string) => {
  const youtubeUrl = isValidYoutubeUrl(url) ? url : ''

  const videoId = youtubeUrl ? extractYouTubeVideoIdFromUrl(youtubeUrl) : ''

  return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : ''
}

export const getYoutubeEmbedLink = (url: string) => {
  const youtubeUrl = isValidYoutubeUrl(url) ? url : ''

  const videoId = youtubeUrl ? extractYouTubeVideoIdFromUrl(youtubeUrl) : ''

  return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
}

function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  if (match) {
    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0

    return hours * 3600 + minutes * 60 + seconds
  } else {
    console.error('Invalid duration format:', duration)
    return 0
  }
}
