import NextAuth, { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';

import { db } from '@/lib/db';

const config: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const existingUser = await db.user.findUnique({
          where: { username: user.email ?? '' },
        });

        if (!existingUser) throw new Error('User not found');
      } catch (error) {
        console.error('Error handling sign in:', error);
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = {};

      if (!existingUser) return token;

      const expirationDate = new Date();

      // Token expires in 30 days
      expirationDate.setDate(expirationDate.getDate() + 30);
      token.exp = Math.floor(expirationDate.getTime() / 1000);

      return token;
    },
  },
  providers: [
    Credentials({
      async authorize() {
        return null;
      },
    }),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
