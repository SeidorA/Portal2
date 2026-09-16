"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import { SlideData, PresentationContent, TextStyle, HAZ_PRESETS, getHazStyle } from './types';

// Crestone Tools
import CoverGeneratorTool from '@/app/components/crestone/CoverGeneratorTool';
import ConnectionsDiagramTool from '@/app/components/crestone/ConnectionsDiagramTool';
import DeploymentOptionsTool from '@/app/components/crestone/DeploymentOptionsTool';
import DeckGeneratorTool from '@/app/components/crestone/DeckGeneratorTool';
import OriginsDestinationsTool from '@/app/components/crestone/OriginsDestinationsTool';

interface PresentationViewerProps {
  content: PresentationContent | null;
  title: string;
}

export default function PresentationViewer({ content, title }: PresentationViewerProps) {
  const slides: SlideData[] = content?.slides && content.slides.length > 0
    ? content.slides
    : [{ id: 'slide-1', type: 'blank', title, leftContent: '' }];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1 < totalSlides ? prev + 1 : prev));
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Error attempting fullscreen:", err);
        });
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  const getBlockInlineStyle = (
    style?: TextStyle,
    defaultFontSize?: number
  ): React.CSSProperties => {
    if (!style) return defaultFontSize ? { fontSize: `${defaultFontSize}px` } : {};
    return {
      fontSize: style.fontSize
        ? `${style.fontSize}px`
        : defaultFontSize
        ? `${defaultFontSize}px`
        : undefined,
      fontWeight: style.fontWeight || undefined,
      color: style.color || undefined,
      backgroundColor:
        style.backgroundColor && style.backgroundColor !== 'transparent'
          ? style.backgroundColor
          : undefined,
      fontStyle: style.italic ? 'italic' : undefined,
      textDecoration: [
        style.underline ? 'underline' : '',
        style.strikethrough ? 'line-through' : '',
      ]
        .filter(Boolean)
        .join(' ') || undefined,
      textAlign: style.align || 'left',
    };
  };

  const getGridTemplateColumns = () => {
    const dist = currentSlide.distribution || '70-30';
    if (dist === '100') return '1fr';
    if (dist === '50-50') return '1fr 1fr';
    if (dist === '70-30') return '7fr 3fr';
    if (dist === '30-70') return '3fr 7fr';
    if (dist === '60-40') return '6fr 4fr';
    if (dist === '40-60') return '4fr 6fr';
    if (dist === '33-33-33') return '1fr 1fr 1fr';
    if (dist === '50-25-25') return '2fr 1fr 1fr';
    if (dist === '25-50-25') return '1fr 2fr 1fr';
    if (dist === '25-25-50') return '1fr 1fr 2fr';
    if (dist === '25-25-25-25') return '1fr 1fr 1fr 1fr';
    return '1fr 1fr';
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0E131F] min-h-screen relative overflow-hidden select-none"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,176,255,0.06),transparent_60%)] pointer-events-none" />

      {/* Canvas Frame Wrapper ensuring strict 16:9 container */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
        {/* 16:9 Presentation Frame */}
        <div
          className="w-full max-w-6xl xl:max-w-7xl max-h-full aspect-video bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 flex flex-col relative overflow-hidden transition-all duration-300"
          style={{ aspectRatio: '16 / 9' }}
        >
        {/* Haz de luz Background Effect */}
        {currentSlide.hazEffect && (
          <div
            className={getHazStyle(currentSlide.hazPosition).containerClass}
            style={getHazStyle(currentSlide.hazPosition).containerStyle}
          >
            <img
              src={`/img/haz/${currentSlide.hazEffect}.png`}
              alt={`Haz ${currentSlide.hazEffect}`}
              className={getHazStyle(currentSlide.hazPosition).imgClass}
            />
          </div>
        )}

        {/* Render content depending on type */}
        {currentSlide.type === 'resource' ? (
          <div className="w-full h-full relative overflow-hidden z-10 flex items-center justify-center">
            {currentSlide.resourceType === 'cover' && (
              <CoverGeneratorTool
                isEmbedded
                selectedBgId={currentSlide.resourceConfig?.selectedBgId || '9d2o'}
                theme={currentSlide.resourceConfig?.theme || 'dark'}
                coverTitle={currentSlide.resourceConfig?.coverTitle}
                coverSubtitle={currentSlide.resourceConfig?.coverSubtitle}
                coverTag={currentSlide.resourceConfig?.coverTag}
              />
            )}
            {currentSlide.resourceType === 'connections' && (
              <ConnectionsDiagramTool
                isEmbedded
                bgTheme={currentSlide.resourceConfig?.bgTheme || 'light'}
              />
            )}
            {currentSlide.resourceType === 'deployment' && (
              <DeploymentOptionsTool
                isEmbedded
                theme={currentSlide.resourceConfig?.theme || 'light'}
              />
            )}
            {currentSlide.resourceType === 'deck' && (
              <DeckGeneratorTool
                isEmbedded
                activeTab={currentSlide.resourceConfig?.deckTab || 'cover'}
                theme={currentSlide.resourceConfig?.theme || 'light'}
              />
            )}
            {currentSlide.resourceType === 'origins-destinations' && (
              <OriginsDestinationsTool
                isEmbedded
                theme={currentSlide.resourceConfig?.theme || 'light'}
              />
            )}
          </div>
        ) : currentSlide.type === 'columns' && currentSlide.columns && currentSlide.columns.length > 0 ? (
          <div
            className="flex-1 grid h-full w-full relative z-10"
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
          >
            {currentSlide.columns.map((col, cIdx) => {
              const isImageCol = col.type === 'image' || col.isFullBleedImage;
              const isAutoHeight = col.heightMode === 'auto';
              const colPaddingClass =
                col.padding === '0'
                  ? 'p-0'
                  : col.padding === '10'
                  ? 'p-3'
                  : col.padding === '40'
                  ? 'p-12'
                  : 'p-6';
              const colVAlignClass =
                col.verticalAlign === 'top'
                  ? 'justify-start'
                  : col.verticalAlign === 'center'
                  ? 'justify-center'
                  : col.verticalAlign === 'bottom'
                  ? 'justify-end'
                  : 'justify-start';
              const colGlassClass = col.glassEffect
                ? 'backdrop-blur-2xl bg-white/40 dark:bg-neutral-900/40 border border-white/40 dark:border-white/10 rounded-2xl shadow-xl'
                : '';

              return (
                <div
                  key={col.id || cIdx}
                  className={`h-full flex flex-col relative ${
                    isImageCol
                      ? 'p-0 overflow-hidden'
                      : `p-4 overflow-hidden ${isAutoHeight ? colVAlignClass : ''}`
                  }`}
                >
                  {isImageCol ? (
                    col.imageUrl ? (
                      <img
                        src={col.imageUrl}
                        alt="Slide visual"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-900/40 flex items-center justify-center text-neutral-800 text-sm">
                        Sin imagen
                      </div>
                    )
                  ) : (
                    <div
                      className={`w-full flex flex-col ${
                        isAutoHeight ? 'h-auto max-h-full' : `h-full ${colVAlignClass}`
                      } ${colPaddingClass} ${colGlassClass} overflow-y-auto transition-all`}
                    >
                      <div className="space-y-6 w-full">
                        {col.blocks && col.blocks.length > 0 ? (
                          col.blocks.map((b) => (
                          <div key={b.id}>
                            {b.type === 'title' ? (
                              <h2
                                style={getBlockInlineStyle(b.style, 32)}
                                className="text-3xl xl:text-4xl font-extrabold font-poppins text-neutral-900 dark:text-neutral-100 leading-tight"
                              >
                                {b.title || b.content}
                              </h2>
                            ) : b.type === 'explicativo' ? (
                              <div className="flex items-start gap-3.5 my-3">
                                <div className="flex-shrink-0 mt-0.5 text-neutral-900 dark:text-neutral-100">
                                  <CaralIcon
                                    name={(b.icon as any) || 'settings'}
                                    size={
                                      b.size === 'large' ? 26 : b.size === 'small' ? 18 : 22
                                    }
                                  />
                                </div>
                                <div className="flex-1 space-y-1">
                                  <h3
                                    style={getBlockInlineStyle(b.style, 18)}
                                    className={`font-bold font-poppins text-neutral-900 dark:text-neutral-100 leading-snug ${
                                      b.size === 'large'
                                        ? 'text-xl'
                                        : b.size === 'small'
                                        ? 'text-sm'
                                        : 'text-base xl:text-lg'
                                    }`}
                                  >
                                    {b.title || b.content}
                                  </h3>
                                  {b.description && (
                                    <p
                                      className={`text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line ${
                                        b.size === 'large'
                                          ? 'text-base'
                                          : b.size === 'small'
                                          ? 'text-xs'
                                          : 'text-sm xl:text-base'
                                      }`}
                                    >
                                      {b.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : b.type === 'image' ? (
                              <div
                                className={`w-full flex ${
                                  b.imageAlign === 'left'
                                    ? 'justify-start'
                                    : b.imageAlign === 'right'
                                    ? 'justify-end'
                                    : 'justify-center'
                                }`}
                              >
                                <div
                                  style={{
                                    width:
                                      b.imageSize === '25'
                                        ? '25%'
                                        : b.imageSize === '50'
                                        ? '50%'
                                        : b.imageSize === '75'
                                        ? '75%'
                                        : '100%',
                                    padding:
                                      b.imagePadding === '25'
                                        ? '25px'
                                        : b.imagePadding === '10'
                                        ? '10px'
                                        : '0px',
                                  }}
                                  className="rounded-2xl overflow-hidden my-3 shadow-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center transition-all"
                                >
                                  {b.imageUrl ? (
                                    <img
                                      src={b.imageUrl}
                                      alt={b.title || 'Slide Image'}
                                      className={`w-full h-auto max-h-[420px] object-cover ${
                                        b.imagePadding && b.imagePadding !== '0'
                                          ? 'rounded-xl shadow-sm'
                                          : 'rounded-2xl'
                                      }`}
                                    />
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <p
                                style={getBlockInlineStyle(b.style, 16)}
                                className="text-base xl:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line"
                              >
                                {b.description || b.content}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          {col.title && (
                            <h2 className="text-3xl xl:text-4xl font-extrabold font-poppins text-neutral-900 dark:text-neutral-100 leading-tight">
                              {col.title}
                            </h2>
                          )}
                          {col.content && (
                            <p className="text-base xl:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                              {col.content}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-12 justify-between relative z-10">
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-4xl font-extrabold font-poppins text-neutral-900 dark:text-neutral-100 leading-tight">
                {currentSlide.title || title}
              </h1>

              {currentSlide.leftContent && (
                <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {currentSlide.leftContent}
                </p>
              )}

              {currentSlide.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden max-w-lg border border-neutral-200 dark:border-neutral-800 shadow-md">
                  <img
                    src={currentSlide.imageUrl}
                    alt="Slide media"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>

            {/* Slide Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200/60 dark:border-neutral-800/60 opacity-60 text-xs font-mono text-neutral-800">
              <span>{title}</span>
              <span>{String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}</span>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-neutral-700 shadow-2xl flex items-center gap-4 text-white">
        <button
          onClick={handlePrev}
          disabled={currentSlideIndex === 0}
          className="p-1.5 rounded-full hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Anterior (Flecha izquierda)"
        >
          <CaralIcon name="chevronLeft" size={20} />
        </button>

        <span className="text-xs font-mono font-bold tracking-widest text-neutral-300">
          {String(currentSlideIndex + 1).padStart(2, '0')} <span className="opacity-40">/</span> {String(totalSlides).padStart(2, '0')}
        </span>

        <button
          onClick={handleNext}
          disabled={currentSlideIndex === totalSlides - 1}
          className="p-1.5 rounded-full hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Siguiente (Flecha derecha)"
        >
          <CaralIcon name="chevronRigth" size={20} />
        </button>

        <div className="w-px h-4 bg-neutral-700 mx-1" />

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-full hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white cursor-pointer"
          title="Pantalla Completa (F)"
        >
          <CaralIcon name="arrowsMaximize" size={18} />
        </button>
      </div>
    </div>
  );
}
