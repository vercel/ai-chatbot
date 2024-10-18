'use server'

import { kv } from '@vercel/kv'
import { getUser } from '@/app/login/actions'
import { auth } from '@/auth'
import { subscription, User, Session } from '@/lib/types'

export async function createSubscription(
  email: string,
  plan: string,
  period: string
) {
    console.log('Creating subscription for user', email)

    try {
        const user = await getUser(email as string)

        // console.log('User', user)

        // const subs = await kv.get(`subscription:${user.id}`)

        const endDate = period === 'monthly' ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))

        const subscription: subscription = {
            id: crypto.randomUUID(),
            userId: user.id,
            plan,
            period,
            startDate: new Date(),
            endDate: endDate
        }

        const newUser: User = {
            ...user,
            plan,
            period,
            subscriptionId: subscription.id
        }

        // get by subscription userId
        const isSubscribed = await kv.get(`subscription:${user.id}`)
        console.log('Is subscribed', isSubscribed)

        if (isSubscribed) {
            await kv.hmset(`subscription:${isSubscribed.id}`, subscription)
            await kv.hmset(`user:${user.email}`, newUser)
            return subscription
        }

        await kv.hmset(`subscription:${subscription.id}`, subscription)
        await kv.hmset(`user:${user.email}`, newUser)

        console.log(`Subscription created for user ${user.email}`)

        return subscription
    } catch (error) {
        console.log(error)
        return {
            error: 'Error creating subscription'
        }
    }

}

export async function getSubscription(id: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'Unauthorized'
        }
    } else {
        const user = await getUser(session.user?.email as string)

        const subscriptions = await kv.get(`subscription:${user.id}`)

        return subscriptions
    }
}

export async function cancelSubscription(email: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'Unauthorized'
        }
    } else {
        const user = await getUser(session.user?.email as string)

        await kv.delete(`subscription:${user.id}`)

        return {
            message: 'Subscription cancelled'
        }
    }
}

export async function changeSubscription(id: string, plan: string, period: string) {
    const session = await auth()

    if (!session || !session.user) {
        return {
            error: 'Unauthorized'
        }
    } else {
        const user = await getUser(session.user?.email as string)

        const subscription = await getSubscription(user.id)

        if (subscription) {
            const updatedSubscription = {
                ...subscription,
                plan,
                period
            }

            await kv.hmset(`subscription:${user.id}`, updatedSubscription)

            return updatedSubscription
        } else {
            return {
                error: 'Subscription not found'
            }
        }
    }
}