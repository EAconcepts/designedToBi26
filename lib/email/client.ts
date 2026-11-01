import { render } from '@react-email/render';
import { env } from '@/lib/env';

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
 * Send an email via Brevo with guaranteed non-throwing error handling.
 * Never throws to the caller — returns { ok: false, error: ... } on failure.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const from = options.from || env.server.EMAIL_FROM;

  try {
    let htmlContent: string | undefined;
    if (options.react) {
      htmlContent = await render(options.react);
    } else if (options.html) {
      htmlContent = options.html;
    }

    if (!htmlContent && !options.text) {
      return { ok: false, error: 'No email content provided (react, html, or text required)' };
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.server.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from },
        to: (Array.isArray(options.to) ? options.to : [options.to]).map((email) => ({ email })),
        subject: options.subject,
        ...(htmlContent ? { htmlContent } : {}),
        ...(options.text ? { textContent: options.text } : {}),
        ...(options.replyTo ? { replyTo: { email: options.replyTo } } : {}),
      }),
    });

    const result = (await response.json()) as {
      messageId?: string;
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      const message = result.message || result.code || response.statusText;
      console.error('[EMAIL ERROR] Brevo returned error:', message);
      return { ok: false, error: message };
    }

    return { ok: true, id: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[EMAIL EXCEPTION] Failed to send email:', message);
    return { ok: false, error: message };
  }
}
