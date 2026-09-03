'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Supabase Auth Error:', error.message)
    return redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  let targetPath = '/dashboard'
  if (user && user.user_metadata?.default_screen) {
    targetPath = user.user_metadata.default_screen === 'dashboard' ? '/dashboard' : `/${user.user_metadata.default_screen}`
  }

  revalidatePath(targetPath)
  redirect(targetPath)
}
