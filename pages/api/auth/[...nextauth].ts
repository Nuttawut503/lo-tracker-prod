import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

interface TokenFormat {
  username: string
  email: string
  access_token: string
  refresh_token: string
  access_exp: number
  refresh_exp: number
  is_teacher: boolean
  role_level: number
}

interface ErrorFormat {
  error: string
}

export default NextAuth({
  providers: [
    Credentials({
      name: "custom provider",
      credentials: {
        username: { label: "username", type: "text", placeholder: "username" },
        password: { label: "password", type: "password", placeholder: "password" },
      },
      async authorize(credentials) {
        const response = await fetch(process.env.AUTH_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({userid: credentials?.username, password: credentials?.password}),
        })
        if (!response.ok || response.status >= 400) {
          const err: ErrorFormat = await response.json()
          throw err.error
        }
        const token: TokenFormat = await response.json()
        return {
          ...token,
          id: credentials?.username,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: 'jwt------secret',
  },
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        return {
          accessToken: user.access_token,
          refreshToken: user.refresh_token,
          accessExpire: user.refresh_exp,
          refreshExpire: user.refresh_exp,
          isTeacher: user.is_teacher,
          roleLevel: user.role_level,
          username: user.username,
          email: user.email,
          id: user.id,
        };
      }
      return token
    },
    async session({session, token}) {
      session = {
        user: {
          id: token.id as string,
          email: token.email as string,
          name: token.username as string,
          accessToken: token.accessToken as string,
          teacher: (token.isTeacher as boolean)?{
            roleLevel: token.roleLevel as number,
          }:null,
        },
        error: null,
        expires: '',
      }
      return session
    }
  }
});
