"use client";

import React from "react";
import { Button } from "caralstable";
import sidebarConfig from "../../sidebar.config.json";
import { useSidebar, SidebarItem, SidebarSection } from "./SidebarProvider";
import { createClient } from "@/utils/supabase/client";

import { useRouter, usePathname } from "next/navigation";
import { Brand, CaralIcon } from "iconcaral2";

export type { SidebarItem, SidebarSection };

const checkActive = (node: SidebarItem, currentPath: string): boolean => {
  if (node.href && node.href === currentPath) return true;
  if (node.children) {
    return node.children.some(child => checkActive(child, currentPath));
  }
  return false;
};

export const SidebarItemNode = ({
  item,
  level = 0,
  pathname,
  router,
  onNavigate,
}: {
  item: SidebarItem;
  level?: number;
  pathname: string;
  router: any;
  onNavigate?: () => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (item.children) {
      if (checkActive(item, pathname)) setIsOpen(true);
    }
  }, [pathname, item]);

  const isActive = item.href ? pathname === item.href : false;
  const isFolder = !!item.children && item.children.length > 0;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else if (item.href) {
      router.push(item.href);
      if (onNavigate) onNavigate();
    }
  };

  return (
    <div className="w-full flex flex-col">
      <Button
        variant={isActive ? "info" : "ghost"}
        className={`justify-start! font-medium! w-full px-2! ${item.className || ""}`}
        onClick={handleClick}
      >
        <div className="flex flex-1 items-center gap-2 justify-between" style={{ paddingLeft: `${level * 1}rem`, width: '100%' }}>
          <div className="flex items-center gap-2 truncate">
            {item.icon && (
              item.isBrand ? (
                <Brand name={item.icon as any} size={20} />
              ) : (
                <CaralIcon name={item.icon as any} size={20} />
              )
            )}
            <span className="truncate">{item.label}</span>
          </div>
          {isFolder && (
            <div className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <CaralIcon name={isOpen ? 'chevronUp' : 'chevronDown'} size={16} />
            </div>
          )}
        </div>
      </Button>
      {isFolder && isOpen && (
        <div className="flex flex-col w-full mt-1">
          {item.children!.map((child, idx) => (
            <SidebarItemNode key={idx} item={child} level={level + 1} pathname={pathname} router={router} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar({
  dynamicSections,
  allowedPaths,
  isAdmin = false,
  showLogout = false,
  className = "",
}: {
  dynamicSections?: SidebarSection[];
  allowedPaths?: string[];
  isAdmin?: boolean;
  showLogout?: boolean;
  className?: string;
}) {
  const sections = dynamicSections || (sidebarConfig as SidebarSection[]);
  const { isSidebarOpen, setSidebarSections } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Filtramos las secciones y elementos en base a allowedPaths
  const publicScreens = ["/dashboard", "/perfil"];
  
  const filteredSections = React.useMemo(() => {
    return sections
      .filter(section => {
        if (section.adminOnly && !isAdmin) return false;
        return true;
      })
      .map(section => {
        return {
          ...section,
          items: section.items.filter(item => {
            if (item.adminOnly && !isAdmin) return false;
            if (isAdmin) return true; // El Admin ve todo
            if (!item.href) return true; // Si es una carpeta, la dejamos y evaluaremos sus hijos si es necesario
            if (publicScreens.some(p => item.href === p || item.href?.startsWith(p + "/"))) return true;
            if (!allowedPaths) return true; // Si no pasamos allowedPaths, asumimos que mostramos todo
            return allowedPaths.some(p => item.href === p || item.href?.startsWith(p + "/"));
          })
        };
      }).filter(section => section.items.length > 0); // Ocultar secciones vacías
  }, [sections, isAdmin, allowedPaths]);

  React.useEffect(() => {
    setSidebarSections(filteredSections);
  }, [filteredSections, setSidebarSections]);

  React.useEffect(() => {
    return () => {
      setSidebarSections(null);
    };
  }, [setSidebarSections]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside
      style={{
        width: isSidebarOpen ? 250 : 0,
        minWidth: isSidebarOpen ? 250 : 0,
        maxWidth: isSidebarOpen ? 250 : 0,
      }}
      className={`hidden md:!block transition-all duration-300 ease-in-out border-neutral-400 shrink-0 bg-container overflow-y-auto overflow-x-hidden ${className || "h-full"} ${
        isSidebarOpen
          ? "p-4 border-r opacity-100"
          : "!p-0 !border-0 opacity-0 invisible pointer-events-none"
      }`}
    >
      <div className="flex flex-col gap-4">
        {filteredSections.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            {sectionIndex > 0 && (
              <hr className="border-neutral-200 dark:border-neutral-700 my-1" />
            )}
            <div className="flex flex-col gap-1 w-full">
              {section.title && (
                <span className="text-neutral-800 text-sm font-medium font-poppins py-2">
                  {section.title}
                </span>
              )}
              {section.items.map((item, itemIndex) => (
                <SidebarItemNode key={itemIndex} item={item} pathname={pathname} router={router} />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
      
      {/* Botón temporal para cerrar sesión y probar perfiles */}
      {showLogout && (
        <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="danger" className="w-full justify-center" onClick={handleLogout}>
            <CaralIcon name="logout" size={18} className="mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      )}
    </aside>
  );
}
