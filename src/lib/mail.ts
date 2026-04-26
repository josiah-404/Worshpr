import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { type ReactElement } from 'react';
import { OnboardingEmail } from '@/emails/templates/onboarding-email';
import { ResetPasswordEmail } from '@/emails/templates/reset-password-email';

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

async function sendMail({ to, subject, template }: EmailOptions) {
  try {
    const html = await render(template);

    const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const domain = new URL(appUrl).hostname;

    const info = await transporter.sendMail({
      from: `"Worshpr" <${process.env.GMAIL_USER}>`,
      replyTo: `no-reply@${domain}`,
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

export async function sendOnboardingEmail(
  to: string,
  name: string,
  setupUrl: string,
) {
  await sendMail({
    to,
    subject: 'Set up your Worshpr account',
    template: OnboardingEmail({ name, setupUrl }),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
) {
  await sendMail({
    to,
    subject: 'Reset your Worshpr password',
    template: ResetPasswordEmail({ name, resetUrl }),
  });
}
