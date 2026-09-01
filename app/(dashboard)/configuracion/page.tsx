import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ConfigForm from "./ConfigForm";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtenemos el rol para saber qué pantallas puede elegir como default
  let roleName = null;
  let isAdmin = false;
  let allowedScreens: { id: string, title: string }[] = [
    { id: 'dashboard', title: 'Inicio (Por defecto)' }
  ];

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role_id, roles(name)')
    .eq('user_id', user.id)
    .single();

  if (userRoleData && userRoleData.roles) {
    roleName = userRoleData.roles.name;
    if (roleName.toLowerCase() === 'admin' || roleName.toLowerCase() === 'administrador') {
      isAdmin = true;
    }
  }

  const allScreens = [
    { id: 'oportunidades', title: 'Oportunidades' },
    { id: 'usuarios', title: 'Usuarios' },
    { id: 'roles', title: 'Roles' },
    { id: 'contenido', title: 'Contenido' },
    { id: 'productos', title: 'Productos' },
    { id: 'configuracion', title: 'Configuración' },
    { id: 'tickets', title: 'Tickets' },
    { id: 'developer-settings', title: 'Developer Settings' },
    { id: 'docs', title: 'Documentación' },
    { id: 'sugerencias', title: 'Sugerencias' },
    { id: 'mi-portal', title: 'Mi Portal' }
  ];

  if (isAdmin) {
    allowedScreens = [...allowedScreens, ...allScreens];
  } else if (roleName) {
    const { data: policies } = await supabase
      .from('role_policies')
      .select('resource_id, access_level')
      .eq('role_name', roleName)
      .eq('resource_type', 'screen');

    if (policies) {
      const allowedIds = policies
        .filter(p => p.access_level !== 'Sin acceso')
        .map(p => p.resource_id);
      
      const filteredScreens = allScreens.filter(s => allowedIds.includes(s.id));
      allowedScreens = [...allowedScreens, ...filteredScreens];
    }
  }

  return (
    <div className="mx-auto w-full p-8 pt-12 animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-4xl font-poppins font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Configuración
        </h1>
        <p className="text-lg text-neutral-700 dark:text-neutral-100 leading-relaxed mb-2">
          Administra tus preferencias de visualización y detalles de tu cuenta.
        </p>
      </div>

      <ConfigForm user={user} allowedScreens={allowedScreens} />
    </div>
  );
}
