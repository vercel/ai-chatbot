// get session

import { auth } from '@/auth'
import { Session, User } from '@/lib/types'
import { kv } from '@vercel/kv'
import { getUser } from '@/app/login/actions'

export async function POST(req: Request) {

    if (req.method !== 'POST') {
        return {
            status: 405,
            body: 'Method Not Allowed'
        }
    }

    // if (!req.headers.get('authorization')) {
    //     return {
    //         status: 401,
    //         body: 'Unauthorized'
    //     }
    // }

    const session = (await auth()) as Session

    const user = await kv.hgetall<User>(`user:${session.user.email}`)
    
    return Response.json(user)
}
