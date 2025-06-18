import passport from 'passport';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      const name = profile.displayName;
     const email = profile.emails?.[0]?.value;
if (!email) return done(new Error('No email from Google'), undefined);

let user = await prisma.user.findUnique({ where: { email } });

if (!user) {
  user = await prisma.user.create({
    data: {
      name: profile.displayName,
      email,
      password: 'google_oauth_dummy_password',
      googleId: profile.id, // Now works after schema update
    },
  });
}


      return done(null, user);
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done: (err: any, user?: any) => void) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});

export default passport;
