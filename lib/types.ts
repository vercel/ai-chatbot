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

/* 
 _                   _             
| |                 (_)            
| | ___   __ _  __ _ _ _ __   __ _ 
| |/ _ \ / _` |/ _` | | '_ \ / _` |
| | (_) | (_| | (_| | | | | | (_| |
|_|\___/ \__, |\__, |_|_| |_|\__, |
          __/ | __/ |         __/ |
         |___/ |___/         |___/ 
 */
// Enforce a basic UUID format
export type UUID = `${string}-${string}-${string}-${string}-${string}`

// Enforce a string of digits (timestamp)
export type Timestamp = `${number}`

// HTTP methods
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PATCH'
  | 'DELETE'
  | 'PUT'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'

// Route starting with "/"
export type Route = `/${string}`

// Combining everything into a log output type
export type RouteLogOutput = `${UUID} | ${Timestamp} | ${HttpMethod} | ${Route}`
