// auth.ts

export const { auth, signIn, signOut } = {
  auth: async () => {
    return {
      user: { name: 'John Doe', email: 'john@example.com' },
      expires: '2024-08-09T00:00:00.000Z'
    }
  },
  signIn: async () => {
    console.log('Sign in logic')
  },
  signOut: async () => {
    console.log('Sign out logic')
  }
}
