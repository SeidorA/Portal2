import { SidebarProvider } from "../components/SidebarProvider";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { RouteGuard } from "../components/RouteGuard";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let roleName = null;
  let allowedPaths: string[] = [];

  let isAdmin = false;

  if (user) {
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
  }

  if (roleName && !isAdmin) {
    const { data: policies } = await supabase
      .from('role_policies')
      .select('resource_id, access_level')
      .eq('role_name', roleName)
      .eq('resource_type', 'screen');
      
    if (policies) {
      // Map the resource_id to actual paths
      allowedPaths = policies
        .filter(p => p.access_level !== 'Sin acceso')
        .map(p => `/${p.resource_id}`);
    }
  }

  return (
    <SidebarProvider>
      <Navbar showSidebarToggle={true} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar allowedPaths={allowedPaths} isAdmin={isAdmin} showLogout={true} />
        <main className="flex-1 overflow-y-auto p-4 bg-full">
          <RouteGuard allowedPaths={allowedPaths} isAdmin={isAdmin}>
            {children}
          </RouteGuard>
        </main>
      </div>
    </SidebarProvider>
  );
}
