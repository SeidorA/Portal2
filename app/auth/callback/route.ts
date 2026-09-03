import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  const next = searchParams.get('next') ?? '/dashboard';

  // Obtener el origen público real (evita que dentro de Docker redirija a 0.0.0.0:3000)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host') || 'v2.portal.seidoranalytics.com';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  if (errorParam) {
    console.error('OAuth provider error:', errorParam);
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      let targetPath = next;
      if (user?.user_metadata?.default_screen && next === '/dashboard') {
        targetPath = user.user_metadata.default_screen === 'dashboard' ? '/dashboard' : `/${user.user_metadata.default_screen}`;
      }
      return NextResponse.redirect(`${origin}${targetPath}`);
    } else {
      console.error('Error exchanging code for session:', error.message);
      return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?message=No se recibio codigo de autenticacion`);
}
