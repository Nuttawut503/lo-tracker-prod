import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      accessToken: string
      teacher: {
        roleLevel: number
      } | null
    }
    error: Error | null
  }
}
