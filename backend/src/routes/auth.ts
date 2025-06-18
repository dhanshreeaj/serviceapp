import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { sendVerificationEmail } from '../utils/sendEmail'; // ✅ Adjust path if needed


dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

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
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  prisma.user.findUnique({ where: { email } })
    .then(user => {
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      return bcrypt.compare(password, user.password).then(isMatch => {
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
          return res.status(403).json({ message: 'Please verify your email' });
        }

        const token = jwt.sign(
          { id: user.id, role: user.role }, // Make sure role exists
          SECRET_KEY,
          { expiresIn: '1d' }
        );

        // ✅ Send role in response
        res.status(200).json({ token, role: user.role });
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: 'Login failed' });
    });
});

export default router;
