'use server'
import prisma from './prisma'
import type { IUser } from './types'

export const getCurrentUser = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    if (!user) {
      return null
    }
    return JSON.parse(JSON.stringify(user))
  } catch (error: any) {
    console.error(error.message)
  }
}

export const createOrUpdateUser = async (userData: IUser) => {
  try {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      create: { ...userData },
      update: { ...userData }
    })
    if (!user) {
      throw new Error('User not found')
    }
    return user
  } catch (error) {
    console.error(error)
    throw new Error('Error creating or updating user')
  }
}
