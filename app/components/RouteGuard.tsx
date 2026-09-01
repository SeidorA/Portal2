"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const publicScreens = ["/dashboard", "/perfil"];

export function RouteGuard({ children, allowedPaths, isAdmin = false }: { children: React.ReactNode, allowedPaths: string[], isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setAuthorized(true);
      return;
    }

    // Si la ruta es pública, dejamos pasar
    const isPublic = publicScreens.some(p => pathname === p || pathname.startsWith(p + "/"));
    
    // Si la ruta está permitida por las políticas del usuario
    const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
    
    // Si no es el inicio y no tiene acceso
    if (!isPublic && !isAllowed && pathname !== "/") {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [pathname, allowedPaths, router, isAdmin]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
