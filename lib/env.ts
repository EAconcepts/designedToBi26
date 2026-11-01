import { z } from 'zod';

export const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  GUEST_COOKIE_SECRET: z.string().min(1, 'GUEST_COOKIE_SECRET is required'),
  ADMIN_ALLOWLIST: z.string().min(1, 'ADMIN_ALLOWLIST is required'),
  NOTIFY_EMAIL: z.string().email('NOTIFY_EMAIL must be a valid email'),
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1, 'CLOUDINARY_UPLOAD_PRESET is required'),
  PAYSTACK_SECRET_KEY: z.string().min(1, 'PAYSTACK_SECRET_KEY is required'),

  // Optional hardening / conditional keys
  SENTRY_DSN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

export const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().min(1, 'NEXT_PUBLIC_SITE_URL is required'),

  // Optional hardening / conditional keys
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

export interface Env {
  readonly server: ServerEnv;
  readonly public: PublicEnv;
  readonly isDev: boolean;
  readonly isProd: boolean;
  readonly isPreview: boolean;
  readonly nodeEnv: string;
  readonly vercelEnv: string | undefined;
}

export function validateEnv(rawEnv: Record<string, unknown> = process.env): {
  server: ServerEnv;
  public: PublicEnv;
} {
  const serverResult = serverSchema.safeParse(rawEnv);
  const publicResult = publicSchema.safeParse(rawEnv);

  const errors: string[] = [];

  if (!serverResult.success) {
    for (const issue of serverResult.error.issues) {
      const key = issue.path.join('.');
      errors.push(`[SERVER] ${key}: ${issue.message}`);
    }
  }

  if (!publicResult.success) {
    for (const issue of publicResult.error.issues) {
      const key = issue.path.join('.');
      errors.push(`[PUBLIC] ${key}: ${issue.message}`);
    }
  }

  if (errors.length > 0) {
    const message = `Invalid or missing environment variables:\n  ${errors.join('\n  ')}`;
    throw new Error(message);
  }

  return {
    server: serverResult.data as ServerEnv,
    public: publicResult.data as PublicEnv,
  };
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const vercelEnv = process.env.VERCEL_ENV;

function createEnv(): Env {
  const parsed = validateEnv(process.env);

  return Object.freeze({
    server: Object.freeze(parsed.server),
    public: Object.freeze(parsed.public),
    isDev: nodeEnv === 'development',
    isProd: nodeEnv === 'production',
    isPreview: vercelEnv === 'preview',
    nodeEnv,
    vercelEnv,
  });
}

let cachedEnv: Env | undefined;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    if (typeof window !== 'undefined') {
      const clientEnv: Env = Object.freeze({
        server: {} as ServerEnv,
        public: Object.freeze(
          publicSchema.parse({
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? '',
            NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          }),
        ),
        isDev: nodeEnv === 'development',
        isProd: nodeEnv === 'production',
        isPreview: vercelEnv === 'preview',
        nodeEnv,
        vercelEnv,
      });
      return clientEnv[prop as keyof Env];
    }

    if (!cachedEnv) {
      cachedEnv = createEnv();
    }
    return cachedEnv[prop as keyof Env];
  },
});
