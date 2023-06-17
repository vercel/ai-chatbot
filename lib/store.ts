import { models, Model } from '@/constants/models'
import { atom } from 'jotai'

export const modelAtom = atom<Model>(models[0])
