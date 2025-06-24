import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient  } from '@prisma/client';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendVerificationEmail } from '../utils/sendEmail';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// ✅ Register (without async/await)
router.post('/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
   .then((existingUser:UserType | null) => {

      if (existingUser) {
       res.status(400).json({ message: 'Email already in use' });
       return;
      }

      return bcrypt.hash(password, 10)
        .then(hashedPassword => {
          return prisma.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
              isVerified: false,
            }
          });
        })
        .then(user => {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          return prisma.verification.create({ data: { userId: user.id, otp } })
            .then(() => sendVerificationEmail(email, otp))
            .then(() => {
              res.status(201).json({ message: 'Registered successfully. Check your email.' });
            });
        });
    })
    .catch((err: Error) => {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Registration failed' });
    });
});

// ✅ Email Verification
router.post('/verify-email', (req: Request, res: Response) => {
  const { email, otp } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then((user: UserType| null) => {
      if (!user) return res.status(404).json({ message: 'User not found' });

      prisma.verification.findFirst({ where: { userId:Number(user.id), otp } })
        .then((validCode: any) => {
          if (!validCode) return res.status(400).json({ message: 'Invalid OTP' });

          return prisma.user.update({ where: { id:Number( user.id )}, data: { isVerified: true } })
            .then(() => prisma.verification.deleteMany({ where: { userId: Number( user.id) } }))
            .then(() => res.status(200).json({ message: 'Email verified successfully' }));
        });
    })
    .catch((err: Error) => {
      console.error(err);
      res.status(500).json({ message: 'Verification failed' });
    });
});

// ✅ Login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then((user: any) => {
      if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });
      if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email' });

      return bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

          const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
          res.status(200).json({ token, role: user.role });
        });
    })
    .catch((err: Error) => {
      console.error(err);
      res.status(500).json({ message: 'Login failed' });
    });
});

// ✅ Raw Google OAuth
router.get('/google', (req, res) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(redirectUrl);
});

type UserType = Awaited<ReturnType<typeof prisma.user.findUnique>>;

function handleGoogleCallback(code: string, res: Response): void {
  axios
    .post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    })
    .then((tokenRes) => {
      const access_token = (tokenRes.data as { access_token: string }).access_token;

      return axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    })
    .then((profileRes) => {
      const { name, email } = profileRes.data as { name: string; email: string };

      if (!email) throw new Error('Email not found');

      return prisma.user.findUnique({ where: { email } }).then((user: UserType) => {
        if (user) return user;

        return prisma.user.create({
          data: {
            name,
            email,
            password: 'google_oauth_dummy_password', // Optional if using Google only
            isVerified: true,
          },
        });
      });
    })
    .then((user: NonNullable<UserType>) => {
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

      res.redirect(`http://localhost:3000/google-success?token=${token}&role=${user.role}`);
    })
    .catch((err: unknown) => {
      console.error('Google OAuth Error:', err);
      res.status(500).json({ message: 'Authentication failed' });
    });
}

// ✅ Route handler (Promise-based)
router.get('/google/callback', (req: Request, res: Response): void => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).json({ message: 'Authorization code is missing' });
    return;
  }

  handleGoogleCallback(code, res);
});


export default router;
