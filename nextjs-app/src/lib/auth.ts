import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { dbConnect } from './db';
import { User } from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Only handle Google sign-ins
      if (account?.provider !== 'google') return false;

      try {
        await dbConnect();

        // Upsert: create user on first login, update googleId on subsequent logins
        await User.findOneAndUpdate(
          { email: user.email!.toLowerCase() },
          {
            $setOnInsert: {
              name: user.name ?? 'Google User',
              email: user.email!.toLowerCase(),
            },
            $set: {
              googleId: user.id,
              image: user.image,
            },
          },
          { upsert: true, new: true }
        );

        return true;
      } catch (error) {
        console.error('Error upserting user on Google sign-in:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // On first sign-in, fetch the MongoDB _id and attach it to the token
      if (account?.provider === 'google' && user?.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: user.email.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error('Error fetching user in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
