"use client";
import React, { createContext, useContext, useState } from "react";

export type SidebarItem = {
  label: string;
  icon: string | null;
  href?: string;
  isBrand?: boolean;
  variant?: "info" | "ghost" | "default" | "success" | "warning" | "danger" | "indido" | "sakura" | "light" | "carbon" | "tab";
  className?: string;
  children?: SidebarItem[];
  adminOnly?: boolean;
};

export type SidebarSection = {
  title: string | null;
  items: SidebarItem[];
  adminOnly?: boolean;
};

type SidebarContextType = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  sidebarSections: SidebarSection[] | null;
  setSidebarSections: (sections: SidebarSection[] | null) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarSections, setSidebarSectionsState] = useState<SidebarSection[] | null>(null);
  
  const setSidebarSections = React.useCallback((newSections: SidebarSection[] | null) => {
    setSidebarSectionsState((prev) => {
      if (prev === newSections) return prev;
      if (!prev && !newSections) return prev;
      if (JSON.stringify(prev) === JSON.stringify(newSections)) return prev;
      return newSections;
    });
  }, []);

  const toggleSidebar = React.useCallback(() => setIsSidebarOpen((prev) => !prev), []);
  
  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar, sidebarSections, setSidebarSections }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      isSidebarOpen: false,
      setIsSidebarOpen: () => {},
      toggleSidebar: () => {},
      sidebarSections: null,
      setSidebarSections: () => {},
    };
  }
  return context;
}
