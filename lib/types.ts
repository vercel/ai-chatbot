import { CoreMessage } from 'ai'

export type Message = CoreMessage & {
  id: string
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}

export interface Player {
  playerName: string;
  playerId: string;
  team: string;
  position: string;
  height: string;
  weight: string;
  college: string;
  image: string;
  dob: string;
  idScore: number;
}

export interface NERResults {
  players: Array<Player>
}

export interface DatabaseQueryResult {
  userPrompt: string;
  // queryResults not needed
  queryAnswer: string;
  sqlQuery: string;
  querySummary: string;
  nerResults: NERResults;
}