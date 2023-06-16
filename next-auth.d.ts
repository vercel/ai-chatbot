declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    }
  }
}
