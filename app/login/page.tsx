import React from 'react'
import { login } from './actions'
import { Button } from 'caralstable'

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
        
        <label className="text-md font-poppins text-neutral-800 dark:text-neutral-200" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-neutral-300 dark:border-neutral-700 mb-6 font-poppins"
          name="email"
          placeholder="tu@email.com"
          required
        />
        
        <label className="text-md font-poppins text-neutral-800 dark:text-neutral-200" htmlFor="password">
          Contraseña
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-neutral-300 dark:border-neutral-700 mb-6 font-poppins"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <Button variant="info" className="w-full">
          Entrar al Dashboard
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
