import React from 'react'
import { login } from './actions'
import { Button } from 'caralstable'
import LoginMicrosoftButton from '@/app/components/LoginMicrosoftButton'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <form
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        action={login}
      >
        <h1 className="text-3xl font-poppins font-bold text-center mb-8">
          Iniciar Sesión
        </h1>
        
        <LoginMicrosoftButton />

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-neutral-900 px-2 text-neutral-500">
              o con credenciales locales
            </span>
          </div>
        </div>

        <label className="text-md font-poppins text-neutral-800 dark:text-neutral-200" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-neutral-300 dark:border-neutral-700 mb-4 font-poppins"
          name="email"
          placeholder="tu@email.com"
        />
        
        <label className="text-md font-poppins text-neutral-800 dark:text-neutral-200" htmlFor="password">
          Contraseña
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-neutral-300 dark:border-neutral-700 mb-6 font-poppins"
          type="password"
          name="password"
          placeholder="••••••••"
        />
        
        <Button variant="ghost" className="w-full border border-neutral-300 dark:border-neutral-700">
          Entrar con Email
        </Button>
        
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-center rounded-md font-poppins">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
