"use client";

import React, { useState, useEffect, useRef } from "react";
import { CaralIcon, Brand } from "iconcaral2";
import { Button } from "caralstable";
import { useSidebar } from "./SidebarProvider";
import { SidebarItemNode } from "./Sidebar";
import Avatar from "./Avatar";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import { searchGlobal, SearchResult } from "@/app/actions/searchAction";
import { logSearchEvent } from "@/app/actions/logSearchClickAction";
import { useTranslation } from "../context/LanguageContext";

type NavChildMock = {
  id: string;
  title?: string;
  type: "link interno" | "link externo" | "titulo" | "divisor" | "espectacular";
  url?: string;
  producto?: string;
  seccion?: string;
  pagina?: string;
  description?: string;
  iconName?: string;
  isBrand?: boolean;
  imageUrl?: string;
  buttonText?: string;
  linkType?: "interno" | "externo";
};

type NavItemMock = {
  id: string;
  title: string;
  description?: string;
  type: "link interno" | "link externo" | "dropdown" | "avatar";
  visual: "texto" | "texto-icono" | "icono";
  cols?: number;
  children?: { [colIndex: number]: NavChildMock[] };
  url?: string;
  producto?: string;
  seccion?: string;
  pagina?: string;
};

interface NavbarProps {
  showSidebarToggle?: boolean;
}

export default function Navbar({ showSidebarToggle = false }: NavbarProps) {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileDropdowns, setExpandedMobileDropdowns] = useState<{ [id: string]: boolean }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const handleCloseSearch = (clicked: boolean, url?: string) => {
    setIsSearchModalOpen(false);
    const query = searchQueryRef.current.trim();
    if (query.length >= 3) {
      logSearchEvent(query, clicked, url).catch(console.error);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchGlobal(searchQuery);
        setSearchResults(response.results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Dynamic Config State
  const [leftItems, setLeftItems] = useState<NavItemMock[]>([
    { id: "1", title: "Productos", type: "dropdown", visual: "texto", cols: 3 },
    { id: "2", title: "Novedades", type: "link", visual: "texto" },
  ]);
  const [rightItems, setRightItems] = useState<NavItemMock[]>([
    { id: "documentacion", title: "Documentación interna", type: "link", visual: "icono" },
    { id: "perfil", title: "Perfil", type: "dropdown", visual: "icono" },
  ]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [lockedDropdown, setLockedDropdown] = useState<string | null>(null);

  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setLockedDropdown(null);
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    if (lockedDropdown || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [lockedDropdown, isMobileMenuOpen]);

  const { isSidebarOpen, toggleSidebar, sidebarSections } = useSidebar();
  const pathname = usePathname();
  const [mobileMenuView, setMobileMenuView] = useState<"nav" | "sidebar">("sidebar");

  const hasDocSidebar = Boolean(sidebarSections && sidebarSections.length > 0);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setLockedDropdown(null);
    if (hasDocSidebar) {
      setMobileMenuView("sidebar");
    } else {
      setMobileMenuView("nav");
    }
  }, [pathname, hasDocSidebar]);

  const toggleMobileDropdown = (id: string) => {
    setExpandedMobileDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoadingUser(false);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('global_config')
        .select('data')
        .eq('section', 'navbar')
        .single();

      if (data?.data) {
        setLeftItems(data.data.leftItems || []);
        setRightItems(data.data.rightItems || []);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as 'light' | 'dark' | 'system' | null;
    const initialTheme = storedTheme || 'system';
    setThemePreference(initialTheme);

    const isDark = initialTheme === 'dark' || (initialTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        handleCloseSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemePreference(newTheme);
    localStorage.setItem("theme", newTheme);
    const isDark = newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const renderNavItem = (item: NavItemMock) => {
    if (item.type === "dropdown") {
      return (
        <div key={item.id}>
          <Button
            variant="ghost"
            isDropdown
            className="flex items-center gap-2"
            onMouseEnter={() => setActiveDropdown(item.id)}
            onMouseLeave={() => { if (lockedDropdown !== item.id) setActiveDropdown(null); }}
            onClick={() => setLockedDropdown(lockedDropdown === item.id ? null : item.id)}
          >
            {(item.visual === 'texto-icono' || item.visual === 'icono') && item.iconName && (
              <div className="shrink-0 flex items-center">
                {item.isBrand ? <Brand name={item.iconName as any} size="s" /> : <CaralIcon name={item.iconName as any} size="s" />}
              </div>
            )}
            {item.visual !== 'icono' && item.title}
          </Button>
          {(activeDropdown === item.id || lockedDropdown === item.id) && (
            <div
              className="absolute top-full left-0 w-full bg-container border-t border-neutral-200 shadow-xl lg:p-8 md:p-5 sm:p-0 z-[100] animate-fade-in"
              onMouseEnter={() => setActiveDropdown(item.id)}
              onMouseLeave={() => { if (lockedDropdown !== item.id) setActiveDropdown(null); }}
            >
              <div
                className="grid gap-8 max-w-[1400px] mx-auto w-full"
                style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))` }}
              >
                {Array.from({ length: item.cols || 1 }).map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-2">
                    {(item.children?.[colIndex] || []).map((child) => (
                      <React.Fragment key={child.id}>
                        {child.type === 'titulo' && <h4 className="font-semibold text-neutral-800 font-poppins text-sm mb-1">{child.title}</h4>}
                        {child.type === 'divisor' && <div className="h-px bg-neutral-800  w-full my-2"></div>}
                        {(child.type === 'link interno' || child.type === 'link externo') && (
                          <div
                            className="flex flex-col items-start gap-0 p-3 -mx-3 rounded-xl hover:bg-seidor-light/20 hover:shadow-lg hover:shadow-black/80 transition-colors cursor-pointer"
                            onClick={() => {
                              if (child.type === 'link externo' && child.url) {
                                window.open(child.url, '_blank');
                              } else if (child.type === 'link interno' && child.producto && child.pagina) {
                                router.push(`/docs/${child.producto}/${child.pagina}`);
                              }
                              setLockedDropdown(null);
                              setActiveDropdown(null);
                            }}
                          >
                            <div className="flex gap-2 items-center">
                              {child.iconName && (
                                <div className="text-info-main mt-0.5 shrink-0">
                                  {child.isBrand ? (
                                    <Brand name={child.iconName as any} size="s" />
                                  ) : (
                                    <CaralIcon name={child.iconName as any} size="s" />
                                  )}
                                </div>
                              )}

                              <span className="font-semibold text-neutral-900 font-poppins text-sm leading-tight">
                                {child.title}
                              </span>
                            </div>
                            {child.description && (
                              <span className="text-xs text-neutral-800 mt-1 font-poppins leading-relaxed">
                                {child.description}
                              </span>
                            )}
                          </div>
                        )}
                        {child.type === 'espectacular' && (
                          <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-800/50 rounded-xl overflow-hidden mt-2 border border-neutral-200 dark:border-neutral-700">
                            {child.imageUrl && (
                              <div className="w-full h-32 relative">
                                <img src={child.imageUrl} alt={child.title || "Espectacular"} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="p-4 flex flex-col gap-2">
                              {child.title && <h4 className="font-semibold text-neutral-900 dark:text-white font-poppins text-sm">{child.title}</h4>}
                              {child.description && <p className="text-xs text-neutral-600 dark:text-neutral-400 font-poppins leading-relaxed">{child.description}</p>}
                              {child.buttonText && (
                                <Button
                                  variant="info"
                                  className="mt-2 w-full justify-center"
                                  onClick={() => {
                                    if (child.linkType === 'externo' && child.url) {
                                      window.open(child.url, '_blank');
                                    } else if ((!child.linkType || child.linkType === 'interno') && child.producto && child.pagina) {
                                      router.push(`/docs/${child.producto}/${child.pagina}`);
                                    }
                                    setLockedDropdown(null);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  {child.buttonText}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => {
          if (item.type === 'link externo' && item.url) {
            window.open(item.url, '_blank');
          } else if (item.type === 'link interno' && item.producto && item.pagina) {
            router.push(`/docs/${item.producto}/${item.pagina}`);
          }
        }}
      >
        {(item.visual === 'texto-icono' || item.visual === 'icono') && item.iconName && (
          <div className="shrink-0 flex items-center">
            {item.isBrand ? <Brand name={item.iconName as any} size="s" /> : <CaralIcon name={item.iconName as any} size="s" />}
          </div>
        )}
        {item.visual !== 'icono' && item.title}
      </Button>
    );
  };

  const shouldShowToggle =
    showSidebarToggle ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/documentacion") ||
    hasDocSidebar;

  return (
    <>
      <div ref={navbarRef} className="sticky top-0 z-50 bg-container! w-full shrink-0 border-b border-neutral-400">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 w-full">
          {/* Sección Izquierda: Menú Hamburguesa (mobile), Sidebar Toggle (docs), Logo y Navegación Desktop */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
            {/* Botón hamburguesa para móvil */}
            <div className="flex md:!hidden">
              <Button
                variant="ghost"
                isIconButton
                iconName={isMobileMenuOpen ? "x" : "menu"}
                onClick={() => {
                  if (!isMobileMenuOpen && hasDocSidebar) {
                    setMobileMenuView("sidebar");
                  }
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                aria-label="Abrir menú"
              />
            </div>

            {shouldShowToggle && (
              <div className="hidden md:!flex">
                <Button
                  variant={isSidebarOpen ? "info" : "ghost"}
                  isIconButton
                  iconName="closeSidebarRigt"
                  onClick={toggleSidebar}
                  aria-label={isSidebarOpen ? "Ocultar menú lateral" : "Mostrar menú lateral"}
                />
              </div>
            )}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <img
                src={isDarkMode ? "/portalDark.png" : "/portalLigth.png"}
                alt="portalSeidor"
                className="h-7 sm:h-8 w-auto object-contain"
              />
            </a>
            <div className="hidden md:!flex items-center gap-2">
              {leftItems.map(item => renderNavItem(item))}
            </div>
          </div>

          {/* Buscador Central (Desktop & Tablet) */}
          <div className="hidden md:!flex flex-1 justify-center max-w-md mx-4">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center justify-between border border-neutral-800 rounded-full px-4 py-2 w-full transition-colors cursor-pointer group hover:border-neutral-900"
            >
              <div className="flex items-center gap-2 text-neutral-800 group-hover:text-neutral-900 transition-colors">
                <CaralIcon name="search" size="s" />
                <span className="font-poppins text-p text-neutral-800 group-hover:text-neutral-900">{t('nav.search', 'Buscar')}</span>
              </div>
              <div className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border rounded-full px-2 py-0.5 text-xs text-neutral-800 dark:text-neutral-400 font-medium shrink-0">
                ⌘ K
              </div>
            </button>
          </div>

          {/* Sección Derecha: Icono de Búsqueda Móvil, Docs y Perfil */}
          <div className="flex items-center gap-1.5 sm:gap-3 relative shrink-0 justify-end">
            {/* Icono de búsqueda exclusivo para móvil */}
            <div className="flex md:!hidden">
              <Button
                variant="ghost"
                isIconButton
                iconName="search"
                size="md"
                onClick={() => setIsSearchModalOpen(true)}
                aria-label={t('nav.search', 'Buscar')}
              />
            </div>

            {rightItems.map(item => {
              const isAvatar = item.type === "avatar";
              const isDocs = item.id === "documentacion" || item.title.toLowerCase().includes("documentación");

              if (isDocs) {
                return (
                  <div key={item.id} className="hidden sm:!flex">
                    <Button
                      variant="ghost"
                      isIconButton
                      iconName="book"
                      size="md"
                      onClick={() => router.push('/documentacion')}
                    />
                  </div>
                );
              }

              if (isAvatar) {
                return (
                  <React.Fragment key={item.id}>
                    {isLoadingUser ? (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0 z-50 relative"></div>
                    ) : user ? (
                      <div className="z-50 relative">
                        <Avatar
                          type="initials"
                          initials={user.email ? user.email.substring(0, 2).toUpperCase() : "UP"}
                          backgroundColor="bg-blue-500"
                          textColor="text-white"
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        />
                      </div>
                    ) : (
                      <Button iconName="arrowRight" variant="info" onClick={() => router.push('/login')}>
                        {t('nav.login', 'Log in')}
                      </Button>
                    )}
                  </React.Fragment>
                );
              }

              return (
                <div key={item.id} className="hidden sm:!flex">
                  {renderNavItem(item)}
                </div>
              );
            })}

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && user && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                <div className="absolute top-14 right-0 max-w-[calc(100vw-1.5rem)] w-80 bg-container border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-2 flex flex-col z-50 animate-fade-in font-poppins">
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 mb-1">
                    <div className="flex items-center gap-3">
                      <Avatar
                        type="initials"
                        initials={user?.email ? user.email.substring(0, 2).toUpperCase() : "UP"}
                        backgroundColor="bg-blue-500"
                        textColor="text-white"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Usuario de Prueba')}</p>
                        <p className="text-xs text-neutral-800 truncate">{user?.email || 'usuario@ejemplo.com'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex gap-1 bg-neutral-800 p-1 rounded-lg">
                      <Button
                        variant={themePreference === 'light' ? 'light' : 'ghost'}
                        isIconButton
                        iconName="sunBright"
                        className={`w-full text-xs ${themePreference === 'light' ? 'border border-neutral-300 dark:border-neutral-600 shadow-sm' : ''}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        {t('nav.themeLight', 'Claro')}
                      </Button>
                      <Button
                        variant={themePreference === 'dark' ? 'carbon' : 'ghost'}
                        isIconButton
                        iconName="sunMoon"
                        className={`w-full text-xs ${themePreference === 'dark' ? 'border border-neutral-300 dark:border-neutral-600 shadow-sm bg-transparent!' : ''}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        {t('nav.themeDark', 'Oscuro')}
                      </Button>
                      <Button
                        variant={themePreference === 'system' ? 'light' : 'ghost'}
                        isIconButton
                        iconName="screenView"
                        className={`w-full text-xs ${themePreference === 'system' ? 'border border-neutral-300 dark:border-neutral-600 shadow-sm bg-transparent!' : ''}`}
                        onClick={() => handleThemeChange('system')}
                      >
                        {t('nav.themeSystem', 'Sistema')}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-2 border-b border-neutral-200 dark:border-neutral-800">
                    <Button 
                      iconName="user" 
                      onClick={() => { setIsProfileMenuOpen(false); router.push('/perfil'); }} 
                      className="justify-start!" 
                      variant="ghost"
                    >
                      {t('nav.profile', 'Perfil')}
                    </Button>
                    <Button 
                      iconName="city" 
                      onClick={() => { setIsProfileMenuOpen(false); router.push('/dashboard'); }} 
                      className="justify-start!" 
                      variant="ghost"
                    >
                      {t('nav.dashboard', 'Dashboard')}
                    </Button>
                    <Button 
                      iconName="wrench" 
                      onClick={() => { setIsProfileMenuOpen(false); router.push('/configuracion'); }} 
                      className="justify-start!" 
                      variant="ghost"
                    >
                      {t('nav.settings', 'Configuración')}
                    </Button>
                    <Button 
                      iconName="globe" 
                      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} 
                      className="justify-start!" 
                      variant="ghost"
                    >
                      <div className="w-full text-start flex items-center justify-between">
                        <span>{language === 'es' ? 'Español' : 'English'}</span>
                        <span className="text-xs text-neutral-400 font-normal uppercase tracking-wider">{language === 'es' ? 'EN' : 'ES'}</span>
                      </div>
                      <CaralIcon name="chevronRigth" size="m" />
                    </Button>
                    <Button iconName="command" className="justify-start!" variant="ghost">
                      {t('nav.version', 'Versión')} 1.0.0
                    </Button>
                  </div>

                  <div className="p-4">
                    <Button onClick={handleLogout} className="justify-start! w-full" iconName="arrowLeft" variant="danger" hasBorder>
                      {t('nav.logout', 'Cerrar Sesión')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer / Menu */}
        {isMobileMenuOpen && (
          <div className="md:!hidden border-t border-neutral-200 dark:border-neutral-800 bg-container shadow-xl overflow-y-auto h-screen animate-slide-up">
            <div className="flex flex-col p-4 gap-2 font-poppins pb-24">
              {/* VISTA 1: Documentación / Sidebar */}
              {hasDocSidebar && mobileMenuView === "sidebar" ? (
                <div className="flex flex-col gap-3">
                  {/* Botón superior para volver a navegación */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                    <button
                      onClick={() => setMobileMenuView("nav")}
                      className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 hover:text-info-main transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <CaralIcon name="chevronLeft" size="s" />
                      <span>{t('nav.backToNav', 'Volver a navegación')}</span>
                    </button>
                    <span className="text-xs font-medium text-neutral-400">
                      {t('sidebar.documentation', 'Documentación')}
                    </span>
                  </div>

                  {/* Secciones de la Sidebar */}
                  <div className="flex flex-col gap-4">
                    {sidebarSections?.map((section, sectionIndex) => (
                      <React.Fragment key={sectionIndex}>
                        {sectionIndex > 0 && (
                          <hr className="border-neutral-200 dark:border-neutral-700 my-1" />
                        )}
                        <div className="flex flex-col gap-1 w-full">
                          {section.title && (
                            <span className="text-neutral-700 dark:text-neutral-300 text-xs uppercase tracking-wider font-semibold font-poppins py-1 px-2">
                              {section.title}
                            </span>
                          )}
                          {section.items.map((item, itemIndex) => (
                            <SidebarItemNode
                              key={itemIndex}
                              item={item}
                              pathname={pathname}
                              router={router}
                              onNavigate={() => setIsMobileMenuOpen(false)}
                            />
                          ))}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ) : (
                /* VISTA 2: Navegación Global */
                <div className="flex flex-col gap-1.5">
                  {/* Botón para volver al contenido del documento (si existe sidebar) */}
                  {hasDocSidebar && (
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-2">
                      <button
                        onClick={() => setMobileMenuView("sidebar")}
                        className="flex items-center justify-between w-full p-2.5 rounded-xl bg-info-light/20 text-info-hard dark:text-info-light font-medium text-sm transition-colors cursor-pointer hover:bg-info-light/30"
                      >
                        <div className="flex items-center gap-2">
                          <CaralIcon name="book" size="s" />
                          <span>{t('nav.viewDocContent', 'Ver contenido del documento')}</span>
                        </div>
                        <CaralIcon name="chevronRigth" size="s" />
                      </button>
                    </div>
                  )}

                  {leftItems.map((item) => {
                    if (item.type === "dropdown") {
                      const isExpanded = !!expandedMobileDropdowns[item.id];
                      return (
                        <div key={item.id} className="flex flex-col rounded-xl overflow-hidden bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                          <button
                            onClick={() => toggleMobileDropdown(item.id)}
                            className="flex items-center justify-between p-3 text-left w-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                              {item.iconName && (
                                <div className="shrink-0">
                                  {item.isBrand ? <Brand name={item.iconName as any} size="s" /> : <CaralIcon name={item.iconName as any} size="s" />}
                                </div>
                              )}
                              <span>{item.title}</span>
                            </div>
                            <div className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                              <CaralIcon name="chevronDown" size="s" />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 flex flex-col gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-2 bg-neutral-200/50">
                              {Array.from({ length: item.cols || 1 }).map((_, colIndex) => (
                                <React.Fragment key={colIndex}>
                                  {(item.children?.[colIndex] || []).map((child) => (
                                    <React.Fragment key={child.id}>
                                      {child.type === 'titulo' && (
                                        <h4 className="font-semibold text-neutral-800 text-xs uppercase tracking-wider mt-2 px-1">
                                          {child.title}
                                        </h4>
                                      )}
                                      {child.type === 'divisor' && (
                                        <div className="h-px bg-neutral-300 w-full my-1"></div>
                                      )}
                                      {(child.type === 'link interno' || child.type === 'link externo') && (
                                        <div
                                          className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-seidor-light/20 cursor-pointer transition-colors"
                                          onClick={() => {
                                            if (child.type === 'link externo' && child.url) {
                                              window.open(child.url, '_blank');
                                            } else if (child.type === 'link interno' && child.producto && child.pagina) {
                                              router.push(`/docs/${child.producto}/${child.pagina}`);
                                            } else if (child.url) {
                                              router.push(child.url);
                                            }
                                            setIsMobileMenuOpen(false);
                                          }}
                                        >
                                          {child.iconName && (
                                            <div className="text-info-main mt-0.5 shrink-0">
                                              {child.isBrand ? (
                                                <Brand name={child.iconName as any} size="s" />
                                              ) : (
                                                <CaralIcon name={child.iconName as any} size="s" />
                                              )}
                                            </div>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-neutral-900 text-sm">
                                              {child.title}
                                            </span>
                                            {child.description && (
                                              <span className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                {child.description}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {child.type === 'espectacular' && (
                                        <div className="flex flex-col bg-neutral-50 dark:bg-neutral-800/50 rounded-xl overflow-hidden mt-2 border border-neutral-200 dark:border-neutral-700">
                                          {child.imageUrl && (
                                            <div className="w-full h-28 relative">
                                              <img src={child.imageUrl} alt={child.title || "Espectacular"} className="w-full h-full object-cover" />
                                            </div>
                                          )}
                                          <div className="p-3 flex flex-col gap-1.5">
                                            {child.title && <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{child.title}</h4>}
                                            {child.description && <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{child.description}</p>}
                                            {child.buttonText && (
                                              <Button
                                                variant="info"
                                                size="sm"
                                                className="mt-1.5 w-full justify-center"
                                                onClick={() => {
                                                  if (child.linkType === 'externo' && child.url) {
                                                    window.open(child.url, '_blank');
                                                  } else if ((!child.linkType || child.linkType === 'interno') && child.producto && child.pagina) {
                                                    router.push(`/docs/${child.producto}/${child.pagina}`);
                                                  }
                                                  setIsMobileMenuOpen(false);
                                                }}
                                              >
                                                {child.buttonText}
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.type === 'link externo' && item.url) {
                            window.open(item.url, '_blank');
                          } else if (item.type === 'link interno' && item.producto && item.pagina) {
                            router.push(`/docs/${item.producto}/${item.pagina}`);
                          } else if (item.url) {
                            router.push(item.url);
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100 text-sm transition-colors text-left cursor-pointer"
                      >
                        {item.iconName && (
                          <div className="shrink-0">
                            {item.isBrand ? <Brand name={item.iconName as any} size="s" /> : <CaralIcon name={item.iconName as any} size="s" />}
                          </div>
                        )}
                        <span>{item.title}</span>
                      </button>
                    );
                  })}

                  {/* Documentación Interna in mobile menu */}
                  <button
                    onClick={() => {
                      router.push('/documentacion');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium text-neutral-900 dark:text-neutral-100 text-sm transition-colors text-left cursor-pointer"
                  >
                    <div className="shrink-0 text-info-main">
                      <CaralIcon name="book" size="s" />
                    </div>
                    <span>{t('nav.internalDocs', 'Documentación interna')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm animate-fade-in">
          {/* Overlay clickable para cerrar */}
          <div className="absolute inset-0" onClick={() => handleCloseSearch(false)}></div>

          <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-3 text-neutral-800 w-full relative">
                <CaralIcon name="search" size="s" />
                <input
                  type="text"
                  placeholder={t('nav.searchPlaceholder', 'Busca páginas, documentos, novedades, etc...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-poppins text-neutral-700 dark:text-neutral-300 placeholder-neutral-400"
                  autoFocus
                />
              </div>
              <button
                onClick={() => handleCloseSearch(false)}
                className="text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-200 px-2 py-1 rounded ml-2 whitespace-nowrap"
              >
                Esc
              </button>
            </div>

            <div className="flex flex-col overflow-y-auto max-h-[60vh] font-poppins bg-white dark:bg-neutral-900">
              {isSearching ? (
                <div className="p-8 text-center text-neutral-800 text-sm">{t('nav.searching', 'Buscando...')}</div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col p-2">
                  {searchResults.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => {
                        handleCloseSearch(true, res.url);
                        router.push(res.url);
                      }}
                      className="flex flex-col p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">{res.title}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-neutral-500 text-neutral-800">
                          {res.type}
                        </span>
                      </div>
                      {res.snippet && (
                        <span className="text-xs text-neutral-800 line-clamp-1">{res.snippet}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center text-neutral-800 text-sm">
                  {t('nav.noResultsFor', 'No se encontraron resultados para')} "{searchQuery}"
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-neutral-400 gap-3">
                  <div className="bg-neutral-100  p-4 rounded-full">
                    <CaralIcon name="search" size="m" />
                  </div>
                  <p className="text-sm">{t('nav.searchPrompt', 'Escribe para empezar a buscar en el portal')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
