import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { type ReactElement } from 'react';
import OnboardingEmail from '@/emails/templates/onboarding-email';
import ResetPasswordEmail from '@/emails/templates/reset-password-email';

type EmailOptions = {
  to: string;
  subject: string;
  template: ReactElement;
};

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

export async function sendEmail({ to, subject, template }: EmailOptions) {
  try {
    const html = await render(template);

    const info = await transporter.sendMail({
      from: `Worshpr <${process.env.GMAIL_USERNAME}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.accepted);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error);
    if (error instanceof Error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
    throw new Error('Failed to send email');
  }
}

export async function sendOnboardingEmail(params: {
  email: string;
  name: string;
  token: string;
}) {
  const { email, name, token } = params;
  const setupUrl = `${process.env.NEXTAUTH_URL}/auth/setup-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Welcome to Worshpr – Set Up Your Password',
    template: OnboardingEmail({ name, setupUrl }),
  });
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  token: string;
}) {
  const { email, name, token } = params;
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password – Worshpr',
    template: ResetPasswordEmail({ name, resetUrl }),
  });
}
