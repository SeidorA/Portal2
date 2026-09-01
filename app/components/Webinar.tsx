"use client";

import React, { useState } from "react";
import { CaralIcon } from "iconcaral2";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WebinarProps {
  title: string;
  duration: string;
  lang: string;
  description: React.ReactNode;
  speakers?: string;
  img: string;
  url: string;
  version: string;
}

export default function Webinar({
  title,
  duration,
  lang,
  description,
  speakers,
  img,
  url,
  version,
}: WebinarProps) {
  // El editor a veces "auto-linkea" las URLs poniéndolas entre < y > (ej: <https://...>)
  const cleanImg = img.replace(/^<|>$/g, '');
  const imgside = cleanImg.startsWith("/") || cleanImg.startsWith("http") ? cleanImg : `/img/${cleanImg}`;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlay = () => {
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

    if (isYouTube) {
      setIsModalOpen(true);
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      window.open(url, "_blank");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "visible";
  };

  return (
    <>
      <div className="bg-container border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 rounded-xl flex flex-col xl:flex-row! gap-4 my-6 shadow-sm hover:shadow-md transition-shadow ">
        <div
          className="w-full lg:max-w-[400px] aspect-[442/260] rounded-lg bg-cover bg-center p-3 flex items-end justify-end relative overflow-hidden group shrink-0"
          style={{ backgroundImage: `url(${imgside})` }}
        >
          {/* Overlay to darken image slightly for better play button visibility */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

          <button
            className="relative z-10 w-12 h-12 flex items-center justify-center border-0 rounded-[15px] bg-white/30 backdrop-blur-md text-white hover:text-info-main! transition-all duration-300 hover:bg-white  hover:scale-110 cursor-pointer shadow-lg"
            onClick={handlePlay}
            aria-label="Play Webinar"
          >
            <CaralIcon name="play" size={24} />
          </button>
        </div>

        <div className="flex flex-col justify-between flex-1 py-1">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-neutral-900 m-0 leading-tight">
              {title}
            </h2>

            <div className="flex flex-wrap items-center text-neutral-800 gap-y-2 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <CaralIcon name="clock" size={16} />
                <span>{duration}</span>
              </div>
              <span className="mx-3 text-neutral-500 ">|</span>
              <div className="flex items-center gap-1.5">
                <CaralIcon name="mesagge" size={16} />
                <span>{lang}</span>
              </div>
              <span className="mx-3 text-neutral-500 ">|</span>
              <div className="flex items-center gap-1.5">
                <CaralIcon name="flagPointer" size={16} />
                <span>Versión: {version}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-neutral-900 max-w-[100%] leading-relaxed text-sm prose prose-sm prose-neutral dark:prose-invert">
            {typeof description === 'string' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {description}
              </ReactMarkdown>
            ) : (
              description
            )}
          </div>

          {speakers && (
            <div className="mt-4 text-neutral-700 dark:text-neutral-300 text-sm bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
              <span className="font-semibold mr-2">Oradores:</span>
              {speakers}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] bg-white/80 dark:bg-black/80 backdrop-blur-md w-full h-full flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 p-4 shadow-sm">
            <button
              className="bg-transparent border-0 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-all duration-200 hover:scale-110 cursor-pointer pr-4 flex items-center justify-center"
              onClick={closeModal}
              aria-label="Cerrar modal"
            >
              <CaralIcon name="chevronLeft" size={24} />
            </button>
            <h4 className="m-0 text-lg font-semibold truncate">{title}</h4>
          </div>

          <div className="flex-1 p-4 md:p-8 relative z-[310] flex items-center justify-center w-full max-w-7xl mx-auto">
            <iframe
              className="w-full h-full min-h-[50vh] md:min-h-[70vh] rounded-xl shadow-2xl bg-black"
              src={url}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}
