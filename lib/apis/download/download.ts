import { DownloadResponse } from '@/lib/models/Download'

import { makeRequest, endpoint } from '../base'

export async function downloadFile(params: { file_path: string }) {
  return await makeRequest<DownloadResponse>({
    method: 'POST',
    url: `${endpoint}/download`,

    body: params,
    next: { revalidate: 0 }, // TODO: Cache download result only for one hour
    cb: () => {
      const timeStamp = Date.now()
      console.log('🚀 ~ downloadFile ~ timeStamp:', timeStamp)
    }
  })
}
