'use server'

import { kv } from '@vercel/kv'
import { getUser } from '@/app/login/actions'
import { auth } from '@/auth'
import { stripe } from '@/lib/stripe'
//import { subscription, User, Session } from '@/lib/types'
import { fromUnixTime } from 'date-fns'
import { User } from '@/lib/types'

export async function updateSubscription({
    email,
    customer,
    period,
    plan,
}: User) {
    console.log('Atualizando mensalidade: ', email)

    try {
        const user = await getUser(email as string)
        const newUser = {
            ...user,
            plan,
            period,
            stripeId: customer,
            startDate: new Date(),
            chargeDate: period === 'month' ? fromUnixTime(Date.now() / 1000 + 30 * 24 * 60 * 60) : period === 'anual' ? fromUnixTime(Date.now() / 1000 + 365 * 24 * 60 * 60) : null,
        }
        console.log('updating user', newUser)

        await kv.hmset(`user:${email}`, newUser)

    } catch(error) {
        console.log(error)
        throw new Error('Ocorreu um erro ao adicionar usuário ',error.message)
    }
}

export async function cancelStripeSubscriptions(stripeId: string, filterId?: string) {
    // filterId is the current id that will not be cancelled
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeId,
        })
            
        subscriptions.data.forEach(async (subscription) => {
            if (subscription.id !== filterId) {
                await stripe.subscriptions.cancel(subscription.id)
            }
        })
    } catch(error) {
        console.log(error)
    }
}

export async function removeSubscription(email?: string, stripeId: string) {
    let userEmail = email
    
    if (!email) {
        const stripeUser = await stripe.customers.retrieve(stripeId)
        userEmail = stripeUser.email
    }
    
    console.log('Cancelando mensalidade: ', userEmail)

    const subscription = {
        email: userEmail,
        customer: stripeId,
        plan: 'free',
        period: null,
    }

    await cancelStripeSubscriptions(stripeId);
    await updateSubscription(subscription)

}