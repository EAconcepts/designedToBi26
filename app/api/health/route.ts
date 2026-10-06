import { checkHealth } from '@/lib/health';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return checkHealth();
}
