import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare, hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          // إذا كان لدى المستخدم كلمة مرور مؤقتة فقط
          if (user && user.tempPassword && credentials.password === user.tempPassword) {
            // ترقية الكلمة المؤقتة إلى كلمة دائمة عند أول تسجيل دخول
            const newHashed = await hash(credentials.password, 10)
            await prisma.user.update({
              where: { id: user.id },
              data: { password: newHashed, tempPassword: null, lastLoginAt: new Date() }
            })
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.avatar,
            }
          }
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          // السماح باستخدام كلمة المرور المؤقتة إذا كانت مطابقة
          if (user.tempPassword && credentials.password === user.tempPassword) {
            const newHashed = await hash(credentials.password, 10)
            await prisma.user.update({
              where: { id: user.id },
              data: { password: newHashed, tempPassword: null, lastLoginAt: new Date() }
            })
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.avatar,
            }
          }
          return null
        }

        // نجاح باستخدام كلمة المرور الدائمة
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
}
