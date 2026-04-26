import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { OnboardingEmail } from '@/emails/templates/onboarding-email';
import { ResetPasswordEmail } from '@/emails/templates/reset-password-email';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

async function sendEmail(to: string, subject: string, template: ReactElement) {
  const html = await render(template);
  try {
    await transporter.sendMail({
      from: `"Worshpr" <${process.env.GMAIL_USERNAME}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to send email: ${message}`);
  }
}

export async function sendOnboardingEmail(to: string, name: string, setupUrl: string) {
  await sendEmail(
    to,
    'Set up your Worshpr account',
    OnboardingEmail({ name, setupUrl }),
  );
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  await sendEmail(
    to,
    'Reset your Worshpr password',
    ResetPasswordEmail({ name, resetUrl }),
  );
}
