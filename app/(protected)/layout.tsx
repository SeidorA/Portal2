import Navbar from "../components/Navbar";
import { SidebarProvider } from "../components/SidebarProvider";
import Archivos from '@/app/components/Archivos';

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Navbar showSidebarToggle={false} />
      <main className="flex-1 overflow-y-auto bg-full!">
        {children}
      </main>
    </SidebarProvider>
  );
}
