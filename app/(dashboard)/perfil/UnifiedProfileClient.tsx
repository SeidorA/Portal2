'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/app/context/LanguageContext';
import ProfileLeftSidebar from './components/ProfileLeftSidebar';
import ProfileActivityTab from './tabs/ProfileActivityTab';
import ProfileDocumentsTab from './tabs/ProfileDocumentsTab';
import ProfileApisTab from './tabs/ProfileApisTab';
import ProfilePreferencesTab from './tabs/ProfilePreferencesTab';

export type ProfileTabId = 'general' | 'documentos' | 'apis' | 'preferencias';

interface UnifiedProfileClientProps {
  user: any;
  isAdmin?: boolean;
  allowedScreens: { id: string; title: string }[];
}

export default function UnifiedProfileClient({
  user,
  isAdmin = false,
  allowedScreens = [],
}: UnifiedProfileClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tabParam = (searchParams.get('tab') as ProfileTabId) || 'general';
  const [activeTab, setActiveTab] = useState<ProfileTabId>(
    ['general', 'documentos', 'apis', 'preferencias'].includes(tabParam)
      ? tabParam
      : 'general'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab') as ProfileTabId;
    if (currentTab && ['general', 'documentos', 'apis', 'preferencias'].includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ProfileTabId) => {
    setActiveTab(tab);
    startTransition(() => {
      router.push(`/perfil?tab=${tab}`, { scroll: false });
    });
  };

  const tabs: { id: ProfileTabId; label: string }[] = [
    { id: 'general', label: t('profile.tabContent', 'Contenido') },
    { id: 'documentos', label: t('profile.tabDocuments', 'Documentos') },
    { id: 'apis', label: t('profile.tabDeveloperSettings', 'Developer settings') },
    { id: 'preferencias', label: t('profile.tabPreferences', 'Preferencias') },
  ];

  return (
    <div className="mx-auto w-full p-4 sm:p-8 animate-fade-in pb-24">
      {/* 2-Column Responsive Layout */}
      <div className="flex md:flex-col lg:flex-row items-start gap-8">
        {/* Left Column: Profile Card + Information + MCP Status */}
        <ProfileLeftSidebar user={user} isAdmin={isAdmin} />

        {/* Right Column: Tabs Navigation & Tab Content */}
        <div className="flex-1 bg-container rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
          {/* Top Pill Tabs Container matching Figma */}
          <div className="mb-6 flex items-center">
            <div className="inline-flex items-center gap-1.5 p-2 bg-neutral-500 rounded-xl overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive
                      ? 'bg-neutral-800  text-neutral-100 shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-300/40 dark:hover:bg-neutral-700/50'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === 'general' && <ProfileActivityTab user={user} />}
            {activeTab === 'documentos' && <ProfileDocumentsTab user={user} />}
            {activeTab === 'apis' && <ProfileApisTab />}
            {activeTab === 'preferencias' && (
              <ProfilePreferencesTab user={user} allowedScreens={allowedScreens} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
