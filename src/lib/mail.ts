import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { type ReactElement } from 'react';
import { OnboardingEmail } from '@/emails/templates/onboarding-email';
import { ResetPasswordEmail } from '@/emails/templates/reset-password-email';
import { RegistrationPendingEmail } from '@/emails/templates/registration-pending-email';
import { RegistrationApprovedEmail } from '@/emails/templates/registration-approved-email';
import { RegistrationRejectedEmail } from '@/emails/templates/registration-rejected-email';

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
      from: `"EMBR" <${process.env.GMAIL_USER}>`,
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
    subject: 'Set up your EMBR account',
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
    subject: 'Reset your EMBR password',
    template: ResetPasswordEmail({ name, resetUrl }),
  });
}

export async function sendRegistrationPendingEmail(params: {
  to: string;
  submittedByName: string;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string | null;
  confirmationCode: string;
  registrants: { fullName: string; email: string }[];
  headcount: number;
  paymentIntent: string;
  eventFee: number;
}) {
  await sendMail({
    to: params.to,
    subject: `Registration Received — ${params.eventTitle} [${params.confirmationCode}]`,
    template: RegistrationPendingEmail(params),
  });
}

export async function sendRegistrationApprovedEmail(params: {
  to: string;
  registrantName: string;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string | null;
  confirmationCode: string;
  paymentIntent: string;
  eventFee: number;
  notes: string | null;
}) {
  await sendMail({
    to: params.to,
    subject: `You're Officially Registered — ${params.eventTitle}`,
    template: RegistrationApprovedEmail(params),
  });
}

export async function sendRegistrationRejectedEmail(params: {
  to: string;
  registrantName: string;
  eventTitle: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventVenue: string | null;
  confirmationCode: string;
  reason: string | null;
}) {
  await sendMail({
    to: params.to,
    subject: `Registration Update — ${params.eventTitle}`,
    template: RegistrationRejectedEmail(params),
  });
}
