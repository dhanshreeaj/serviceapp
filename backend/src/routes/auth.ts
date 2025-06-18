import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import axios from 'axios';
import { sendVerificationEmail } from '../utils/sendEmail'; // ✅ Adjust path if needed
import passport from 'passport';
import { profile } from 'console';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// const jwtSecret: string = process.env.JWT_SECRET!;

const JWT_SECRET: string = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

// Register
router.post('/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then(existingUser => {
      if (existingUser) {
        res.status(400).json({ message: 'Email already in use' });
        return null;
      }

      return bcrypt.hash(password, 10);
    })
    .then(hashedPassword => {
      if (!hashedPassword) return null;

      return prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isVerified: false,
        },
      });
    })
    .then(user => {
      if (!user) return;

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      return prisma.verification.create({
        data: {
          userId: user.id,
          otp,
        },
      }).then(() => {
        return sendVerificationEmail(email, otp).then(() => {
          res.status(201).json({
            message: 'Registered successfully. Check your email for the verification code.',
          });
        });
      });
    })
    .catch(err => {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Registration failed' });
    });
});



// Email Verification (chained `.then()` style)
router.post('/verify-email', (req: Request, res: Response) => {
  const { email, otp } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then(user => {
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      return prisma.verification.findFirst({
        where: {
          userId: user.id,
          otp,
        },
      }).then(validCode => {
        if (!validCode) {
          res.status(400).json({ message: 'Invalid OTP' });
          return;
        }

        return prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        }).then(() => {
          return prisma.verification.deleteMany({
            where: { userId: user.id },
          }).then(() => {
            res.status(200).json({ message: 'Email verified successfully' });
          });
        });
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Verification failed' });
    });
});

// Login
// router.post('/login', (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   prisma.user.findUnique({ where: { email } })
//     .then(user => {
//       if (!user) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }

//     //   return bcrypt.compare(password, user.password).then(isMatch => {
//     //     if (!isMatch) {
//     //       return res.status(400).json({ message: 'Invalid credentials' });
//     //     }

//     //     if (!user.isVerified) {
//     //       return res.status(403).json({ message: 'Please verify your email' });
//     //     }

//     //     const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {

//     //       expiresIn: '1d',
//     //     });


//     //     // ✅ Send role in response
//     //     res.status(200).json({ token, role: user.role });
//     //   });
//     // })
//     .catch(err => {
//       console.error(err);
//       res.status(500).json({ message: 'Login failed' });
//     });
// });
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then(user => {
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (!user.password) {
        return res.status(400).json({ message: 'Password not set for this account' });
      }

      return bcrypt.compare(password, user.password).then(isMatch => {
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
          return res.status(403).json({ message: 'Please verify your email' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
          expiresIn: '1d',
        });

        res.status(200).json({ token, role: user.role });
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Login failed' });
    });
});


router.get('/google', (req, res) => {
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(redirectUrl);
});

// Step 2–7: Handle callback
router.get('/google/callback', (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
     res.status(400).json({ message: 'Authorization code is missing' });
     return;
  }

  axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    redirect_uri: GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code',
  })
  .then((tokenRes) => {
    const access_token = (tokenRes.data as any).access_token;

    return axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  })
  .then((profileRes) => {
    const { name, email } = profileRes.data as { name: string; email: string };

    if (!email) {
      res.status(400).json({ message: 'Google account does not provide an email' });
      return Promise.reject('Missing email');
    }

    return prisma.user.findUnique({ where: { email } }).then((user) => {
      if (user) {
        return user;
      }

      return prisma.user.create({
        data: {
          name,
          email,
          password:'google_oauth_dummy_password', // Optional or random password
          isVerified: true,
        },
      });
    });
  })
  .then((user) => {
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {

      expiresIn: '1d',
    });

    res.redirect(`http://localhost:3000/google-success?token=${token}&role=${user.role}`);
  })
  .catch((err) => {
    console.error('Google OAuth Error:', err);
    res.status(500).json({ message: 'Authentication failed' });
  });
});
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Handle callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login', // or frontend route
    session: false, // optional if you use JWT instead of session
  }),
  (req, res) => {
    const user = req.user as any;

    // Generate JWT token (if not using session)
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '1d',
    });

    res.redirect(`http://localhost:3000/google-success?token=${token}&role=${user.role}`);
  }
);

export default router;
function done(arg0: Error, undefined: undefined): void | PromiseLike<void> {
  throw new Error('Function not implemented.');
}

