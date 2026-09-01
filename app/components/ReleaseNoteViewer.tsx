'use client'

import React, { useState } from 'react';
import { CaralIcon, Brand } from 'iconcaral2';
import Link from 'next/link';

interface NewsItem {
  title_slide: string;
  description: string;
  icon: string;
  quicklinks?: { doc: string; text: string }[];
}

interface VersionData {
  version: string;
  link: string;
  date: string;
  description: string;
  news: NewsItem[];
}

function VersionSection({ vData, versionKey, docBaseUrl, imgFolder }: { vData: VersionData, versionKey: string, docBaseUrl?: string, imgFolder?: string }) {
  const [activeTab, setActiveTab] = useState<'action' | 'slider'>('action');
  const [activeSlide, setActiveSlide] = useState(0);

  const slideCount = vData.news?.length || 0;
  const currentItem = slideCount > 0 ? vData.news[activeSlide] : null;

  return (
    <div id={`v${versionKey}`} className="flex flex-col gap-8 scroll-mt-24 pt-8">
      <div className="flex flex-col gap-6">
        <h2 className="text-5xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-4">
          V {vData.version}
        </h2>
      </div>

      <div className="flex gap-6 border-b-2 border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('action')}
          className={`pb-3 font-extrabold text-lg transition-colors relative ${activeTab === 'action'
            ? 'text-info-main'
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
        >
          Action
          {activeTab === 'action' && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-info-main rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('slider')}
          className={`pb-3 font-extrabold text-lg transition-colors relative ${activeTab === 'slider'
            ? 'text-info-main'
            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
        >
          Slider
          {activeTab === 'slider' && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-info-main rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'action' && (
        <div className="flex flex-col gap-12 mt-4 animate-fade-in">
          {vData.description && (
            <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              <CaralIcon name="lightning" size={32} /> All the features of this release
            </h3>
          )}

          <div className="flex flex-col gap-24">
            {vData.news?.map((item, idx) => {
              const isBrand = ['SAP', 'Snowflake', 'OData', 'Excel', 'Google', 'Crestone'].includes(item.icon);
              return (
                <div key={idx} className="flex flex-col gap-6">
                  <h4 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                    {isBrand ? (
                      <Brand name={item.icon as any} size={28} />
                    ) : (
                      <CaralIcon name={(item.icon as any) || 'box'} size={28} />
                    )}
                    {item.title_slide}
                  </h4>
                  <div 
                    className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />

                  {item.quicklinks && item.quicklinks.length > 0 && (
                    <div className="flex gap-4 flex-wrap">
                      {item.quicklinks.map((link, lidx) => {
                        const cleanDocBase = docBaseUrl?.replace(/\/$/, '') || '';
                        const baseWithProtocol = cleanDocBase && !cleanDocBase.startsWith('http') ? `https://${cleanDocBase}` : cleanDocBase;
                        const cleanLink = link.doc.startsWith('/') ? link.doc : `/${link.doc}`;
                        const href = link.doc.startsWith('http') ? link.doc : `${baseWithProtocol}/docs/documentation${cleanLink}`;
                        return (
                          <a
                            key={lidx}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-info-main hover:text-info-hard transition-colors bg-info-main/10 px-3 py-1.5 rounded-full border border-transparent hover:border-info-main hover:bg-white"
                          >
                            <CaralIcon name="link" size={16} />
                            {link.text}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {imgFolder && (
                    <div className="mt-6 rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-center">
                      <img
                        src={`${docBaseUrl || ''}${imgFolder}/${versionKey.replace(/\./g, '')}/${idx}.png`}
                        alt={item.title_slide}
                        className="w-full h-auto object-contain max-h-[700px]"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'slider' && currentItem && (
        <div className="flex flex-col gap-8 mt-4 animate-fade-in">
          {imgFolder && (
            <div className="rounded-xl overflow-hidden bg-[#0A1635] flex items-center justify-center min-h-[500px]">
              <img
                src={`${docBaseUrl || ''}${imgFolder}/${versionKey.replace(/\./g, '')}/${activeSlide}.gif`}
                alt={currentItem.title_slide}
                className="w-full h-auto object-contain max-h-[700px]"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setActiveSlide(s => (s - 1 + slideCount) % slideCount)}
              className="px-6 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <CaralIcon name="arrowLeft" size={16} /> Return
            </button>
            <div className="flex flex-col items-center gap-2">
              <span className="font-bold text-neutral-600 dark:text-neutral-400">
                {activeSlide + 1} / {slideCount}
              </span>
              <div className="flex gap-1.5">
                {vData.news.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activeSlide ? 'bg-neutral-800 dark:bg-neutral-200' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => setActiveSlide(s => (s + 1) % slideCount)}
              className="px-6 py-2 rounded-full bg-[#0A1635] text-white font-semibold hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              Next <CaralIcon name="arrowRight" size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-4">
            <h3 className="text-4xl font-extrabold text-neutral-900 dark:text-white">
              {currentItem.title_slide}
            </h3>
            <div 
              className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: currentItem.description }}
            />
            {currentItem.quicklinks && currentItem.quicklinks.length > 0 && (
              <div className="flex gap-4 flex-wrap mt-2">
                {currentItem.quicklinks.map((link, lidx) => {
                  const cleanDocBase = docBaseUrl?.replace(/\/$/, '') || '';
                  const baseWithProtocol = cleanDocBase && !cleanDocBase.startsWith('http') ? `https://${cleanDocBase}` : cleanDocBase;
                  const cleanLink = link.doc.startsWith('/') ? link.doc : `/${link.doc}`;
                  const href = link.doc.startsWith('http') ? link.doc : `${baseWithProtocol}/docs${cleanLink}`;
                  return (
                    <a
                      key={lidx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-info-main hover:text-info-hard transition-colors bg-info-main/10 px-3 py-1.5 rounded-full border border-transparent hover:border-info-main hover:bg-white"
                    >
                      <CaralIcon name="link" size={16} />
                      {link.text}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReleaseNoteViewer({ data, docBaseUrl, imgFolder }: { data: any, docBaseUrl?: string, imgFolder?: string }) {
  console.log("ReleaseNoteViewer props received -> docBaseUrl:", docBaseUrl, "imgFolder:", imgFolder);
  if (!data) return <div>No se encontraron novedades o ocurrió un error al cargarlas.</div>;

  const versionKeys = Object.keys(data).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col gap-32">
      {versionKeys.map(key => (
        <VersionSection
          key={key}
          versionKey={key}
          vData={data[key]}
          docBaseUrl={docBaseUrl}
          imgFolder={imgFolder}
        />
      ))}
    </div>
  );
}
