import { NextRequest } from 'next/server';
import { POST as handlePostSse } from '../route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return handlePostSse(request);
}
