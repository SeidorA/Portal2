import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-8 pt-12 animate-fade-in pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-poppins font-extrabold text-neutral-900 dark:text-white mb-3 tracking-tight">
          Mi Perfil
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Actualiza tu información personal. Estos datos nos ayudan a identificar a qué empresa perteneces y cómo contactarte.
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
