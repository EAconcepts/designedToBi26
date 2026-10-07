import { Resend } from 'resend';
import { env } from '@/lib/env';

export const resend = new Resend(env.server.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend with guaranteed non-throwing error handling.
 * Never throws to the caller — returns { ok: false, error: ... } on failure.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const from = options.from || env.server.EMAIL_FROM;

  try {
    const base = {
      from,
      to: options.to,
      subject: options.subject,
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    };

    let response: Awaited<ReturnType<typeof resend.emails.send>>;
    if (options.react) {
      response = await resend.emails.send({
        ...base,
        react: options.react,
        ...(options.text ? { text: options.text } : {}),
      });
    } else if (options.html) {
      response = await resend.emails.send({
        ...base,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
      });
    } else if (options.text) {
      response = await resend.emails.send({
        ...base,
        text: options.text,
      });
    } else {
      return { ok: false, error: 'No email content provided (react, html, or text required)' };
    }

    const { data, error } = response;

    if (error) {
      console.error('[EMAIL ERROR] Resend returned error:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[EMAIL EXCEPTION] Failed to send email:', message);
    return { ok: false, error: message };
  }
}
