"use client";

import React, { useState, useEffect, useRef } from "react";
import { CaralIcon, Brand } from "iconcaral2";
import { Button } from "caralstable";
import { useSidebar } from "./SidebarProvider";
import Avatar from "./Avatar";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import { searchGlobal, SearchResult } from "@/app/actions/searchAction";
import { logSearchEvent } from "@/app/actions/logSearchClickAction";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
      }
    };
    if (lockedDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [lockedDropdown]);

  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const pathname = usePathname();

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

  const shouldShowToggle = showSidebarToggle || pathname.startsWith("/docs");

  return (
    <>
      <div ref={navbarRef} className="sticky top-0 z-50 bg-container! flex items-center justify-between px-4 py-2 w-full shrink-0 border-b border-neutral-400">
        {/* Sección Izquierda */}
        <div className="flex items-center gap-4 w-[33.33%]">
          {shouldShowToggle && (
            <Button
              variant={isSidebarOpen ? "ghost" : "info"}
              isIconButton
              iconName="closeSidebarRigt"
              onClick={toggleSidebar}
            />
          )}
          <a href="/" className="flex items-center gap-2">
            <img src={isDarkMode ? "/portalDark.png" : "/portalLigth.png"} alt="portalSeidor" />
          </a>
          <div className="flex items-center gap-2">
            {leftItems.map(item => renderNavItem(item))}
          </div>
        </div>

        <div className="w-[33.33%] flex justify-center">
          {/* Buscador Central */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center justify-between border border-neutral-800 rounded-full px-4 py-2 w-[386px] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-neutral-800 group-hover:text-neutral-800 transition-colors">
              <CaralIcon name="search" size="s" />
              <span className="font-poppins text-p text-neutral-800 group-hover:text-neutral-800">Buscar</span>
            </div>
            <div className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border rounded-full px-2 py-0.5 text-xs text-neutral-800 dark:text-neutral-400 font-medium">
              ⌘ K
            </div>
          </button>
        </div>

        {/* Sección Derecha */}
        <div className="flex items-center gap-4 relative w-[33.33%] justify-end">
          {rightItems.map(item => {
            const isAvatar = item.type === "avatar";
            const isDocs = item.id === "documentacion" || item.title.toLowerCase().includes("documentación");

            if (isDocs) {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  isIconButton
                  iconName="book"
                  size="md"
                  onClick={() => router.push('/documentacion')}
                />
              );
            }

            if (isAvatar) {
              return (
                <React.Fragment key={item.id}>
                  {isLoadingUser ? (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0 z-50 relative"></div>
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
                      Log in
                    </Button>
                  )}
                </React.Fragment>
              );
            }

            return renderNavItem(item);
          })}

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && user && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
              <div className="absolute top-14 right-0 w-80 bg-container border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-2 flex flex-col z-50 animate-fade-in font-poppins">


                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 mb-1">
                  <div className="flex items-center gap-3">
                    <Avatar
                      type="initials"
                      initials={user?.email ? user.email.substring(0, 2).toUpperCase() : "UP"}
                      backgroundColor="bg-blue-500  "
                      textColor="text-white"
                    />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Usuario de Prueba')}</p>
                      <p className="text-xs text-neutral-800">{user?.email || 'usuario@ejemplo.com'}</p>
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
                      Claro
                    </Button>
                    <Button
                      variant={themePreference === 'dark' ? 'carbon' : 'ghost'}
                      isIconButton
                      iconName="sunMoon"
                      className={`w-full text-xs ${themePreference === 'dark' ? 'border border-neutral-300 dark:border-neutral-600 shadow-sm bg-transparent!' : ''}`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      Oscuro
                    </Button>
                    <Button
                      variant={themePreference === 'system' ? 'light' : 'ghost'}
                      isIconButton
                      iconName="screenView"
                      className={`w-full text-xs ${themePreference === 'system' ? 'border border-neutral-300 dark:border-neutral-600 shadow-sm bg-transparent!' : ''}`}
                      onClick={() => handleThemeChange('system')}
                    >
                      Sistema
                    </Button>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800">
                  <Button iconName="user" onClick={() => router.push('/perfil')} className="justify-start!" variant="ghost">Perfil</Button>
                  <Button iconName="city" onClick={() => router.push('/dashboard')} className="justify-start!" variant="ghost">Dashboard</Button>
                  <Button iconName="wrench" onClick={() => router.push('/configuracion')} className="justify-start!" variant="ghost">Configuracion</Button>
                  <Button iconName="globe" className="justify-start!" variant="ghost"><div className="w-full text-start">Español</div> <CaralIcon name="chevronRigth" size="m" /></Button>
                  <Button iconName="command" className="justify-start!" variant="ghost" > Versión </Button>

                </div>


                <div className="p-4">
                  <Button onClick={handleLogout} className="justify-start! w-full" iconName="arrowLeft" variant="danger" hasBorder  >Cerrar Sesión</Button>
                </div>


              </div>
            </>
          )}
        </div>
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
                  placeholder="Busca páginas, documentos, novedades, etc..."
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
                <div className="p-8 text-center text-neutral-800 text-sm">Buscando...</div>
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
                <div className="p-8 text-center text-neutral-800 text-sm">No se encontraron resultados para "{searchQuery}"</div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-neutral-400 gap-3">
                  <div className="bg-neutral-100  p-4 rounded-full">
                    <CaralIcon name="search" size="m" />
                  </div>
                  <p className="text-sm">Escribe para empezar a buscar en el portal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
