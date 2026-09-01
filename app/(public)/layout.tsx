import Navbar from "../components/Navbar";
import { SidebarProvider } from "../components/SidebarProvider";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <main className="flex-1 overflow-y-auto bg-full!">
        {children}
      </main>
    </SidebarProvider>
  );
}
