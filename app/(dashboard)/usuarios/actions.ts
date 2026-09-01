'use server'

import { createClient } from '@supabase/supabase-js'

export async function createNewUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: 'Error del servidor: SUPABASE_SERVICE_ROLE_KEY no está configurada.' }
  }

  // Create an admin client using the service role key to bypass RLS and use auth.admin
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // So they don't have to click a verification link
    })

    if (error) throw error

    return { success: true, user: data.user }
  } catch (err: any) {
    return { error: err.message }
  }
}
