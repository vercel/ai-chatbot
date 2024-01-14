'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import connectDB from '@/lib/connect-db'

function transformChatDocument(chatDoc: any): Chat {
  return {
    ...chatDoc,
    _id: chatDoc._id.toString()
  }
}

export async function saveChatMessage(
  id: string,
  title: string,
  userId: string,
  path: string,
  messages: any[],
  content: string,
  data: any[]
) {
  const createdAt = new Date()
  const modifiedAt = new Date()

  try {
    const db = await connectDB()
    const currentChat = await db.collection('chats').findOne({ id })

    if (!currentChat) {
      const newChat: Chat = {
        _id: new ObjectId(),
        id,
        title,
        userId,
        createdAt,
        modifiedAt,
        path,
        messages: [
          ...messages,
          {
            data, // store data from function call, so UI components can be reconstructed
            content: content,
            role: 'assistant'
          }
        ]
      }

      await db.collection('chats').insertOne(newChat)
    } else {
      currentChat.messages = [
        ...messages,
        {
          data, // store data from function call, so UI components can be reconstructed
          content: content,
          role: 'assistant'
        }
      ]
      currentChat.modifiedAt = modifiedAt

      await db.collection('chats').updateOne({ id }, { $set: currentChat })
    }
  } catch (error) {
    console.error('An error occurred while saving a chat message:', error)
  }
}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const db = await connectDB()
    const chatDocuments = await db
      .collection('chats')
      .find({ userId })
      .toArray()

    const chats: Chat[] = chatDocuments.map(chatDoc =>
      transformChatDocument(chatDoc)
    )

    return chats
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  try {
    const db = await connectDB()
    const chatDocument = await db.collection('chats').findOne({ id })

    if (!chatDocument || (userId && chatDocument.userId !== userId)) {
      return null
    }

    return transformChatDocument(chatDocument)
  } catch (error) {
    return null
  }
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const db = await connectDB()
    const chat = await db.collection('chats').findOne({ id })

    if (chat?.userId !== session?.user?.id) {
      return {
        error: 'Unauthorized'
      }
    }

    if (!chat) {
      return {
        error: 'Chat not found'
      }
    }

    await db.collection('chats').deleteOne({ id })

    revalidatePath('/')
    return revalidatePath(path)
  } catch (error) {
    return {
      error: 'An error occurred while removing the chat'
    }
  }
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const db = await connectDB()
    const chats = await db
      .collection('chats')
      .find({ userId: session.user.id })
      .toArray()

    if (!chats.length) {
      return revalidatePath('/')
    }

    for (const chat of chats) {
      await db.collection('chats').deleteOne({ id: chat.id })
    }

    return revalidatePath('/')
  } catch (error) {
    return {
      error: 'An error occurred while clearing chats'
    }
  }
}

export async function getSharedChat(id: string) {
  try {
    const db = await connectDB()
    const chat = await db.collection('chats').findOne({ id })

    if (!chat || !chat.sharePath) {
      return null
    }

    return chat
  } catch (error) {
    return null
  }
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  try {
    const db = await connectDB()
    const chatDocument = await db.collection('chats').findOne({ id })

    if (!chatDocument || chatDocument.userId !== session.user.id) {
      return {
        error: 'Something went wrong'
      }
    }

    const updatedChatDocument = await db
      .collection('chats')
      .findOneAndUpdate(
        { id: id, userId: session.user.id },
        { $set: { sharePath: `/share/${id}` } },
        { returnDocument: 'after' }
      )

    return transformChatDocument(updatedChatDocument)
  } catch (error) {
    return {
      error: 'An error occurred while sharing the chat'
    }
  }
}
