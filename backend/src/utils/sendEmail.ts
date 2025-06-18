import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (to: string, otp: string) => {
  try {
    const response = await resend.emails.send({
     from: 'Your App <onboarding@resend.dev>',// ✅ must be a verified sender
      to,
      subject: 'Verify your email',
      html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
    });

    console.log('Email sent:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
