// Single transactional-mail entry point.
// Transport: nodemailer over Gmail SMTP using a Google App Password.
//
// Required env vars:
//   GMAIL_USER          your Gmail / Workspace address
//   GMAIL_APP_PASSWORD  the 16-char app password (NOT your account password)
//   FROM_EMAIL          optional override, e.g. '"Highzcore" <noreply@highzcore.tech>'
//
// Gmail send limits: ~500/day on personal Gmail, ~2000/day on Workspace.
// The queue tolerates failures (rows stay un-sent and the next run retries).

import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailPayload, EmailType, RenderedEmail } from './types';
import { renderEmail } from './render';
import { BRAND } from './templates/_layout';

let cachedTransporter: Transporter | null = null;

function transporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('Email transport not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
  }
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return cachedTransporter;
}

function fromAddress(): string {
  return process.env.FROM_EMAIL
      ?? `"${BRAND.name}" <${process.env.GMAIL_USER ?? 'noreply@highzcore.tech'}>`;
}

export interface SendInput<T extends EmailType> {
  to: string;
  type: T;
  payload: EmailPayload<T>;
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export async function sendEmail<T extends EmailType>({ to, type, payload }: SendInput<T>): Promise<SendResult> {
  const rendered: RenderedEmail = renderEmail(type, payload);
  const info = await transporter().sendMail({
    from: fromAddress(),
    to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });

  return {
    messageId: info.messageId,
    accepted: (info.accepted as string[] | undefined) ?? [],
    rejected: (info.rejected as string[] | undefined) ?? [],
  };
}

// Smoke test helper — call from an admin-only API to verify SMTP works.
export async function verifyTransport(): Promise<true> {
  await transporter().verify();
  return true;
}
