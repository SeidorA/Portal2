import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';
import ProfileHeader from './ProfileHeader';

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-8 pt-12 animate-fade-in pb-20">
      <ProfileHeader />
      <ProfileForm user={user} />
    </div>
  );
}
