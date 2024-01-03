'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import { getSupabaseClient } from '@/lib/utils'

const supabase = getSupabaseClient()

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  const { data: chats, error } = await supabase
  .from('chats')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  
  if(error) {
    console.log("Error getting chats: ", error)
    return []
  }

  return chats as Chat[]
}

export async function getChat(id: string, userId: string) {
  const { data: chat, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (!chat || (userId && chat.user_id !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id }: { id: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  // soft delete the chat
  const { data, error } = await supabase
    .from('chats')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) console.log("Error removing chat: ", error)

  revalidatePath('/')
  return revalidatePath(`chat/${id}`)
}

export async function clearChats() {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  // supabase query to soft delete all chats
  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const { data: chat } = await supabase
    .from('chats')
    .select()
    .eq('id', id)
    .single()

  if (!chat || !chat.share_path) {
    return null
  }

  return chat as Chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const { data: chat } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .single()

  if (!chat || chat.user_id !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const sharePath = `/share/${chat.id}`

  const { data, error } = await supabase
    .from('chats')
    .update({ share_path: sharePath })
    .eq('id', id)
    .select()
    .single()

  return data as Chat
}
