import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { useSearchParams } from 'next/navigation'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

// let _userID : string;
// export function getUserID() : string {
//   const searchParams = useSearchParams();
//   return searchParams.get("id") ?? nanoid();
//   // let router = useRouter();
//   // const { query } = router;
//   // _userID = query.id as string

//   //console.log("data: ", searchParams, searchParams.get("id"));
//   _userID = nanoid();
//   console.log("nanoid", _userID);
//   // if(searchParams.has("id")){
//   //   _userID = searchParams.get("id") as string
//   // }

//   return "H5n8e24";
// }

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const json = await res.json()
    if (json.error) {
      const error = new Error(json.error) as Error & {
        status: number
      }
      error.status = res.status
      throw error
    } else {
      throw new Error('An unexpected error occurred')
    }
  }

  return res.json()
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getUniqueId(userId: string, chatId:string) : string
{
  return userId + "_" + chatId;
}
