import { NextRequest } from 'next/server';
import { POST as handlePostSse, OPTIONS as handleOptionsSse } from '../route';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptionsSse();
}

export async function POST(request: NextRequest) {
  return handlePostSse(request);
}

