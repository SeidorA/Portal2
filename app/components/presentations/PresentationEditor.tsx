"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'caralstable';
import { CaralIcon } from 'iconcaral2';
import CoverGeneratorTool from '@/app/components/crestone/CoverGeneratorTool';
import ConnectionsDiagramTool from '@/app/components/crestone/ConnectionsDiagramTool';
import DeploymentOptionsTool from '@/app/components/crestone/DeploymentOptionsTool';
import DeckGeneratorTool from '@/app/components/crestone/DeckGeneratorTool';
import OriginsDestinationsTool from '@/app/components/crestone/OriginsDestinationsTool';
import IconPickerModal from '@/app/components/IconPickerModal';
import {
  SlideData,
  PresentationContent,
  CrestoneResourceType,
  ColumnData,
  SlideBlock,
  CARAL_COLORS,
  TextStyle,
  HazPosition,
  HAZ_PRESETS,
  HAZ_POSITIONS,
  getHazStyle,
} from './types';

interface PresentationEditorProps {
  content: PresentationContent | null;
  title: string;
  onContentChange: (newContent: PresentationContent) => void;
  onTitleChange: (newTitle: string) => void;
  isSaving?: boolean;
}

export default function PresentationEditor({
  content,
  title,
  onContentChange,
  onTitleChange,
  isSaving = false,
}: PresentationEditorProps) {
  // Initialize slides if empty
  const initialSlides: SlideData[] = content?.slides && content.slides.length > 0
    ? content.slides
    : [{ id: 'slide-1', type: 'empty' }];

  const [slides, setSlides] = useState<SlideData[]>(initialSlides);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [leftNavTab, setLeftNavTab] = useState<'slides' | 'recursos'>('slides');
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(true);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const [isChoosingColumns, setIsChoosingColumns] = useState(false);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  const [dragOverSlideIndex, setDragOverSlideIndex] = useState<number | null>(null);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<'text' | 'bg' | null>(null);
  const [rightSidebar, setRightSidebar] = useState<{
    open: boolean;
    blockType: 'image' | 'explicativo' | 'text' | 'title' | 'column' | 'slide' | 'page';
    targetColIndex?: number;
    targetBlockId?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeColumnForUpload, setActiveColumnForUpload] = useState<number | null>(null);

  // Sync slides with parent
  const updateSlides = (newSlides: SlideData[]) => {
    setSlides(newSlides);
    onContentChange({
      ...content,
      slides: newSlides,
    });
  };

  const currentSlide = slides[activeSlideIndex] || slides[0] || { id: 'slide-1', type: 'empty' };

  // Drag & drop reorder slides
  const handleSlideDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/slide-index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSlideIndex(index);
  };

  const handleSlideDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlideIndex !== index) {
      setDragOverSlideIndex(index);
    }
  };

  const handleSlideDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSlideDragEnd = () => {
    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);
    setIsOverDeleteZone(false);
  };

  const handleSlideDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const rawIndex = e.dataTransfer.getData('text/slide-index');
    const fromIndex = rawIndex !== '' ? parseInt(rawIndex, 10) : draggedSlideIndex;

    setDraggedSlideIndex(null);
    setDragOverSlideIndex(null);

    if (fromIndex === null || isNaN(fromIndex) || fromIndex === dropIndex) {
      return;
    }

    const nextSlides = [...slides];
    const [movedSlide] = nextSlides.splice(fromIndex, 1);
    nextSlides.splice(dropIndex, 0, movedSlide);
    updateSlides(nextSlides);

    // Keep the active slide pointing to the right slide index
    if (activeSlideIndex === fromIndex) {
      setActiveSlideIndex(dropIndex);
    } else if (fromIndex < activeSlideIndex && dropIndex >= activeSlideIndex) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (fromIndex > activeSlideIndex && dropIndex <= activeSlideIndex) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  // Slide CRUD
  const handleAddSlide = () => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      type: 'empty',
    };
    const nextSlides = [...slides, newSlide];
    updateSlides(nextSlides);
    setActiveSlideIndex(nextSlides.length - 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const nextSlides = slides.filter((_, i) => i !== index);
    updateSlides(nextSlides);
    if (activeSlideIndex >= nextSlides.length) {
      setActiveSlideIndex(nextSlides.length - 1);
    }
  };

  const handleDuplicateSlide = (index: number) => {
    const slideToDup = slides[index];
    const newSlide: SlideData = {
      ...slideToDup,
      id: `slide-${Date.now()}`,
    };
    const nextSlides = [...slides];
    nextSlides.splice(index + 1, 0, newSlide);
    updateSlides(nextSlides);
    setActiveSlideIndex(index + 1);
  };

  // Update current active slide
  const updateCurrentSlide = (updates: Partial<SlideData>) => {
    const nextSlides = [...slides];
    nextSlides[activeSlideIndex] = {
      ...nextSlides[activeSlideIndex],
      ...updates,
    };
    updateSlides(nextSlides);
  };

  // Step 1: Click "En blanco" -> Opens column selection screen (Figma 848:8230)
  const handleStartBlankFlow = () => {
    setIsChoosingColumns(true);
  };

  // Step 2: Choose Column Quantity (Figma 848:8230 -> 848:8352)
  // Clean initialization: Exactly 1 column can be image (e.g. column 2 for 2-cols), content columns start empty waiting for drag & drop
  const handleSelectColumnCount = (count: 1 | 2 | 3 | 4) => {
    let initialDistribution = '50-50';
    let initialColumns: ColumnData[] = [];

    if (count === 1) {
      initialDistribution = '100';
      initialColumns = [
        { id: 'col-1', type: 'text', blocks: [] }
      ];
    } else if (count === 2) {
      initialDistribution = '70-30';
      initialColumns = [
        { id: 'col-1', type: 'text', blocks: [] },
        { id: 'col-2', type: 'image', isFullBleedImage: true, imageUrl: '' }
      ];
    } else if (count === 3) {
      initialDistribution = '33-33-33';
      initialColumns = [
        { id: 'col-1', type: 'text', blocks: [] },
        { id: 'col-2', type: 'text', blocks: [] },
        { id: 'col-3', type: 'image', isFullBleedImage: true, imageUrl: '' }
      ];
    } else {
      initialDistribution = '25-25-25-25';
      initialColumns = [
        { id: 'col-1', type: 'text', blocks: [] },
        { id: 'col-2', type: 'text', blocks: [] },
        { id: 'col-3', type: 'text', blocks: [] },
        { id: 'col-4', type: 'image', isFullBleedImage: true, imageUrl: '' }
      ];
    }

    updateCurrentSlide({
      type: 'columns',
      columnCount: count,
      distribution: initialDistribution,
      columns: initialColumns,
      title: 'Nueva Diapositiva',
    });
    setIsChoosingColumns(false);
    // Auto-open recursos tab to encourage dragging
    setLeftNavTab('recursos');
    setIsLeftDrawerOpen(true);
  };

  // Step 3: Change distribution ratio for columns (Figma 848:8352)
  const handleChangeDistribution = (dist: string) => {
    updateCurrentSlide({ distribution: dist });
  };

  // Step 4: Update a specific column's data
  const handleUpdateColumn = (colIndex: number, updates: Partial<ColumnData>) => {
    const nextCols = currentSlide.columns ? [...currentSlide.columns] : [];
    if (!nextCols[colIndex]) return;
    nextCols[colIndex] = { ...nextCols[colIndex], ...updates };
    updateCurrentSlide({ columns: nextCols });
  };

  // Drag & Drop: Add Block to a Column
  const handleAddBlockToColumn = (
    colIndex: number,
    blockType: 'title' | 'paragraph' | 'explicativo' | 'image'
  ) => {
    const nextCols = currentSlide.columns ? [...currentSlide.columns] : [];
    const targetCol = nextCols[colIndex];
    if (!targetCol) return;

    // If target column was fullBleedImage, convert to normal column
    const colToUse = targetCol.isFullBleedImage
      ? { ...targetCol, type: 'text' as const, isFullBleedImage: false, blocks: [] }
      : targetCol;

    const currentBlocks = colToUse.blocks || [];
    const newBlockId = `block-${Date.now()}`;
    const newBlock: SlideBlock = {
      id: newBlockId,
      type: blockType,
      content: '',
      title: blockType === 'explicativo' ? 'Mejora de la eficiencia operativa' : '',
      description:
        blockType === 'explicativo'
          ? 'Automatiza los procesos de integración y exportación de datos, reduciendo las tareas manuales y minimizando los errores humanos'
          : '',
      imageUrl: blockType === 'image' ? '' : undefined,
      icon: blockType === 'explicativo' ? 'settings' : undefined,
      size: blockType === 'explicativo' ? 'medium' : undefined,
    };

    nextCols[colIndex] = {
      ...colToUse,
      blocks: [...currentBlocks, newBlock],
    };
    updateCurrentSlide({ columns: nextCols });

    setSelectedBlockId(newBlockId);
    if (blockType === 'explicativo') {
      setRightSidebar({
        open: true,
        blockType: 'explicativo',
        targetColIndex: colIndex,
        targetBlockId: newBlockId,
      });
    } else if (blockType === 'image') {
      setRightSidebar({
        open: true,
        blockType: 'image',
        targetColIndex: colIndex,
        targetBlockId: newBlockId,
      });
    } else if (blockType === 'title' || blockType === 'paragraph') {
      setRightSidebar({
        open: true,
        blockType: 'text',
        targetColIndex: colIndex,
        targetBlockId: newBlockId,
      });
    }
  };

  const handleUpdateBlockField = (
    colIndex: number,
    blockId: string,
    updates: Partial<SlideBlock>
  ) => {
    const nextCols = currentSlide.columns ? [...currentSlide.columns] : [];
    const targetCol = nextCols[colIndex];
    if (!targetCol || !targetCol.blocks) return;

    const updatedBlocks = targetCol.blocks.map((b) =>
      b.id === blockId ? { ...b, ...updates } : b
    );
    nextCols[colIndex] = { ...targetCol, blocks: updatedBlocks };
    updateCurrentSlide({ columns: nextCols });
  };

  const handleUpdateBlock = (colIndex: number, blockId: string, content: string) => {
    handleUpdateBlockField(colIndex, blockId, { content });
  };

  const handleDeleteBlock = (colIndex: number, blockId: string) => {
    const nextCols = currentSlide.columns ? [...currentSlide.columns] : [];
    const targetCol = nextCols[colIndex];
    if (!targetCol || !targetCol.blocks) return;

    const updatedBlocks = targetCol.blocks.filter((b) => b.id !== blockId);
    nextCols[colIndex] = { ...targetCol, blocks: updatedBlocks };
    updateCurrentSlide({ columns: nextCols });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      if (rightSidebar?.targetBlockId === blockId) {
        setRightSidebar(null);
      }
    }
  };

  // Enforce ONLY ONE column can be an image (Brand style rule)
  const handleSetImageColumn = (colIndex: number | null, openUpload: boolean = true) => {
    const nextCols = (currentSlide.columns || []).map((col, idx) => {
      if (colIndex !== null && idx === colIndex) {
        return { ...col, type: 'image' as const, isFullBleedImage: true };
      }
      return { ...col, type: 'text' as const, isFullBleedImage: false };
    });
    updateCurrentSlide({ columns: nextCols });
    if (colIndex !== null && openUpload) {
      handleTriggerUpload(colIndex);
    }
  };

  // Drag & Drop Event Handlers
  const handleDragStart = (
    e: React.DragEvent,
    blockType: 'title' | 'paragraph' | 'explicativo' | 'image'
  ) => {
    e.dataTransfer.setData('text/plain', blockType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverColIndex !== colIndex) {
      setDragOverColIndex(colIndex);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColIndex(null);
  };

  const handleDrop = (e: React.DragEvent, colIndex: number) => {
    e.preventDefault();
    setDragOverColIndex(null);
    const blockType = e.dataTransfer.getData('text/plain') as
      | 'title'
      | 'paragraph'
      | 'explicativo'
      | 'image';

    if (
      blockType === 'title' ||
      blockType === 'paragraph' ||
      blockType === 'explicativo' ||
      blockType === 'image'
    ) {
      const nextCols = currentSlide.columns ? [...currentSlide.columns] : [];
      const targetCol = nextCols[colIndex];
      // If it was an image column, convert to text first
      if (targetCol?.isFullBleedImage) {
        nextCols[colIndex] = { ...targetCol, type: 'text', isFullBleedImage: false, blocks: [] };
        updateCurrentSlide({ columns: nextCols });
      }
      handleAddBlockToColumn(colIndex, blockType);
    }
  };

  // Choose a Crestone Resource
  const handleSelectResource = (resourceType: CrestoneResourceType) => {
    updateCurrentSlide({
      type: 'resource',
      resourceType,
      title: resourceType === 'cover' ? 'Portada' :
        resourceType === 'connections' ? 'Diagrama de Conexiones' :
          resourceType === 'deployment' ? 'Opciones de Despliegue' :
            resourceType === 'origins-destinations' ? 'Listado de Orígenes y Destinos' : 'Generador de Decks',
    });
    setIsResourceModalOpen(false);
    setIsChoosingColumns(false);
  };

  // Apply Haz background
  const handleSelectHaz = (hazId: number) => {
    updateCurrentSlide({
      hazEffect: currentSlide.hazEffect === hazId ? undefined : hazId,
      hazPosition: currentSlide.hazPosition || 'center',
    });
  };

  const handleSelectHazPosition = (position: HazPosition) => {
    updateCurrentSlide({
      hazPosition: position,
    });
  };

  const handleRemoveHaz = () => {
    updateCurrentSlide({
      hazEffect: undefined,
    });
  };

  // Image Upload handler
  const handleTriggerUpload = (colIndex: number) => {
    setActiveColumnForUpload(colIndex);
    setRightSidebar({ open: true, blockType: 'image', targetColIndex: colIndex });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (rightSidebar?.targetBlockId && rightSidebar.targetColIndex !== undefined) {
        handleUpdateBlockField(rightSidebar.targetColIndex, rightSidebar.targetBlockId, {
          imageUrl: base64,
        });
      } else if (activeColumnForUpload !== null) {
        handleUpdateColumn(activeColumnForUpload, {
          imageUrl: base64,
          type: 'image',
          isFullBleedImage: true,
        });
      }
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  // Calculate inline CSS styles for text blocks
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

  // Calculate CSS grid template based on distribution
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
    <div className="flex flex-1 h-full w-full overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 1. Left Vertical Icon Bar (Figma Frame 1419) */}
      <div className="w-16 flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col items-center py-3 gap-3 z-20">
        <button
          onClick={() => {
            if (leftNavTab === 'slides' && isLeftDrawerOpen) {
              setIsLeftDrawerOpen(false);
            } else {
              setLeftNavTab('slides');
              setIsLeftDrawerOpen(true);
            }
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isLeftDrawerOpen && leftNavTab === 'slides'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          title="Diapositivas"
        >
          <CaralIcon name="screenChart" size={20} />
        </button>

        <button
          onClick={() => {
            if (leftNavTab === 'recursos' && isLeftDrawerOpen) {
              setIsLeftDrawerOpen(false);
            } else {
              setLeftNavTab('recursos');
              setIsLeftDrawerOpen(true);
            }
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isLeftDrawerOpen && leftNavTab === 'recursos'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          title="Recursos"
        >
          <CaralIcon name="cube" size={20} />
        </button>

        <div className="w-8 h-px bg-neutral-200 dark:border-neutral-800 my-1" />

        <button
          onClick={handleAddSlide}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          title="Añadir diapositiva"
        >
          <CaralIcon name="plus" size={20} />
        </button>
      </div>

      {/* 2. Left Expandable Panel (Slides or Recursos) */}
      {isLeftDrawerOpen && (
        <div className="w-56 flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden z-10">
          {leftNavTab === 'slides' ? (
            /* Slides Panel (Figma Frame 1420) */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span className="font-bold text-sm font-poppins text-neutral-800 dark:text-neutral-200">
                  Slides ({slides.length})
                </span>
                <button
                  onClick={handleAddSlide}
                  className="p-1 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  title="Nueva diapositiva"
                >
                  <CaralIcon name="plus" size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {slides.map((slide, idx) => {
                  const isActive = idx === activeSlideIndex;
                  const isDragging = draggedSlideIndex === idx;
                  const isDragOver = dragOverSlideIndex === idx && draggedSlideIndex !== idx;

                  return (
                    <div
                      key={slide.id || idx}
                      draggable
                      onDragStart={(e) => handleSlideDragStart(e, idx)}
                      onDragOver={(e) => handleSlideDragOver(e, idx)}
                      onDragLeave={handleSlideDragLeave}
                      onDragEnd={handleSlideDragEnd}
                      onDrop={(e) => handleSlideDrop(e, idx)}
                      onClick={() => {
                        setActiveSlideIndex(idx);
                        setIsChoosingColumns(false);
                      }}
                      className={`group relative rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing p-2 select-none ${isDragging ? 'opacity-30 scale-95 border-dashed border-blue-400 bg-blue-50/20' : ''
                        } ${isDragOver
                          ? 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-50/60 dark:bg-blue-950/40 scale-[1.02]'
                          : isActive
                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-800 dark:group-hover:text-neutral-400 transition-colors">
                            <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                              <circle cx="2" cy="2" r="1.2" />
                              <circle cx="6" cy="2" r="1.2" />
                              <circle cx="2" cy="6" r="1.2" />
                              <circle cx="6" cy="6" r="1.2" />
                              <circle cx="2" cy="10" r="1.2" />
                              <circle cx="6" cy="10" r="1.2" />
                            </svg>
                          </span>
                          <span className="text-xs font-bold text-neutral-400 dark:text-neutral-800 font-mono">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>
                        {slides.length > 1 && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateSlide(idx);
                              }}
                              className="p-0.5 text-neutral-400 hover:text-blue-500 rounded cursor-pointer"
                              title="Duplicar"
                            >
                              <CaralIcon name="copy" size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSlide(idx);
                              }}
                              className="p-0.5 text-neutral-400 hover:text-red-500 rounded cursor-pointer"
                              title="Eliminar"
                            >
                              <CaralIcon name="trash" size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Mini Thumbnail Preview */}
                      <div className="w-full aspect-video rounded-md bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center overflow-hidden p-1 pointer-events-none">
                        {slide.type === 'empty' ? (
                          <span className="text-[10px] text-neutral-400 font-medium">Vacía</span>
                        ) : slide.type === 'resource' ? (
                          <div className="flex flex-col items-center gap-0.5 text-center">
                            <CaralIcon name="cube" size={12} classname="text-blue-500" />
                            <span className="text-[9px] font-medium text-neutral-600 dark:text-neutral-400 truncate max-w-[120px]">
                              {slide.resourceType || 'Recurso'}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col justify-start p-1 text-left">
                            <span className="text-[9px] font-bold text-neutral-700 dark:text-neutral-300 truncate">
                              {slide.title || 'Diapositiva'}
                            </span>
                            <span className="text-[7px] text-neutral-400 truncate mt-0.5">
                              {slide.columns?.[0]?.blocks?.[0]?.content || slide.columns?.[0]?.content || 'Contenido...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 transition-all">
                {draggedSlideIndex !== null ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setIsOverDeleteZone(true);
                    }}
                    onDragLeave={() => setIsOverDeleteZone(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsOverDeleteZone(false);
                      if (draggedSlideIndex !== null && slides.length > 1) {
                        handleDeleteSlide(draggedSlideIndex);
                      }
                      setDraggedSlideIndex(null);
                      setDragOverSlideIndex(null);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all select-none ${isOverDeleteZone
                        ? 'bg-red-500 text-white border-red-600 scale-[1.03] shadow-lg ring-4 ring-red-500/20 font-bold'
                        : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800/80 animate-pulse'
                      }`}
                  >
                    <CaralIcon name="trash" size={16} />
                    <span className="text-xs font-semibold font-poppins">
                      {isOverDeleteZone ? '¡Soltar para eliminar!' : 'Arrastra aquí para eliminar'}
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="light"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={handleAddSlide}
                    iconName="plus"
                  >
                    Añadir Slide
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Recursos Panel (Figma Frame 1448-1459) - DRAGGABLE RESOURCE BLOCKS */
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-sm font-poppins text-neutral-800 dark:text-neutral-200">
                  Recursos
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Arrastra elementos a las columnas
                </span>
              </div>

              <div className="p-3 space-y-4">
                {/* Elementos arrastrables */}
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    Bloques Arrastrables
                  </span>
                  <div className="space-y-2">
                    {/* H1 Titulo */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'title')}
                      onClick={() => handleAddBlockToColumn(0, 'title')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-grab active:cursor-grabbing shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                          H1
                        </span>
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          Título
                        </span>
                      </div>
                      <CaralIcon name="chevronRigth" size={14} classname="text-neutral-400 group-hover:text-blue-500" />
                    </div>

                    {/* Explicativo */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'explicativo')}
                      onClick={() => handleAddBlockToColumn(0, 'explicativo')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-grab active:cursor-grabbing shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <CaralIcon name="rigthJoinW" size={16} classname="text-neutral-800" />
                        <div>
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                            Explicativo
                          </span>
                          <span className="text-[10px] text-neutral-400">Ícono + Título + Texto</span>
                        </div>
                      </div>
                      <CaralIcon name="chevronRigth" size={14} classname="text-neutral-400 group-hover:text-blue-500" />
                    </div>

                    {/* Imagen (Bloque) */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'image')}
                      onClick={() => handleAddBlockToColumn(0, 'image')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-grab active:cursor-grabbing shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <CaralIcon name="image" size={16} classname="text-neutral-800" />
                        <div>
                          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                            Imagen
                          </span>
                          <span className="text-[10px] text-neutral-400">Insertar imagen en bloque</span>
                        </div>
                      </div>
                      <CaralIcon name="chevronRigth" size={14} classname="text-neutral-400 group-hover:text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Crestone Interactive Tools */}
                <div>
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    Herramientas Crestone
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleSelectResource('cover')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CaralIcon name="screenChart" size={16} classname="text-blue-500" />
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          Generador Portadas
                        </span>
                      </div>
                      <CaralIcon name="chevronRigth" size={14} classname="text-neutral-400 group-hover:text-blue-500" />
                    </button>

                    <button
                      onClick={() => handleSelectResource('connections')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CaralIcon name="network" size={16} classname="text-blue-500" />
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          Diagrama Conexiones
                        </span>
                      </div>
                      <CaralIcon name="chevronRigth" size={14} classname="text-neutral-400 group-hover:text-blue-500" />
                    </button>

                    <button
                      onClick={() => handleSelectResource('deployment')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CaralIcon name="database" size={16} classname="text-blue-500" />
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          Opciones Despliegue
                        </span>
                      </div>
                      <CaralIcon name="chevronRigth" size={14} classname="text-neutral-400 group-hover:text-blue-500" />
                    </button>
                  </div>
                </div>

                {/* Background / Haz de luz */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                      Background (Haz de luz)
                    </span>
                    {currentSlide.hazEffect && (
                      <button
                        onClick={handleRemoveHaz}
                        className="text-[10px] text-red-500 hover:underline font-medium cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {HAZ_PRESETS.map((haz) => {
                      const isSelected = currentSlide.hazEffect === haz.id;
                      return (
                        <button
                          key={haz.id}
                          onClick={() => handleSelectHaz(haz.id)}
                          className={`p-1.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 cursor-pointer group ${
                            isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/40'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50'
                          }`}
                        >
                          <div className="w-full h-10 rounded-lg bg-neutral-950 flex items-center justify-center overflow-hidden relative border border-neutral-800/80">
                            <img
                              src={haz.src}
                              alt={haz.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">
                                ✓
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate">
                            {haz.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Position selector inside left drawer */}
                  {currentSlide.hazEffect && (
                    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Posición del Haz
                        </span>
                        <span className="text-[10px] text-blue-500 font-medium">
                          {HAZ_POSITIONS.find((p) => p.id === (currentSlide.hazPosition || 'center'))?.shortLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {HAZ_POSITIONS.map((pos) => {
                          const isPosSelected = (currentSlide.hazPosition || 'center') === pos.id;
                          return (
                            <button
                              key={pos.id}
                              onClick={() => handleSelectHazPosition(pos.id)}
                              className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                isPosSelected
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                              title={pos.label}
                            >
                              <span className="text-xs font-mono">{pos.icon}</span>
                              <span className="text-[9px] truncate max-w-full">{pos.shortLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Center Canvas (Presentation Viewport) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden relative">
        {/* Background Dot Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* FLOATING TOP TOOLBAR (Figma 848:8352) */}
        {currentSlide.type !== 'empty' && (
          <div className="mb-3 z-30 flex items-center flex-wrap gap-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 shadow-lg text-xs animate-fade-in">
            {currentSlide.type === 'columns' && (
              <>
                <span className="text-neutral-400 font-semibold px-1">Distribución:</span>

                {/* Column Distribution Ratio Options */}
                {currentSlide.columnCount === 2 && (
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                    {[
                      { id: '50-50', label: '50 / 50' },
                      { id: '70-30', label: '70 / 30' },
                      { id: '30-70', label: '30 / 70' },
                      { id: '60-40', label: '60 / 40' },
                      { id: '40-60', label: '40 / 60' },
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => handleChangeDistribution(ratio.id)}
                        className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${currentSlide.distribution === ratio.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                )}

                {currentSlide.columnCount === 3 && (
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                    {[
                      { id: '33-33-33', label: '33 / 33 / 33' },
                      { id: '50-25-25', label: '50 / 25 / 25' },
                      { id: '25-50-25', label: '25 / 50 / 25' },
                      { id: '25-25-50', label: '25 / 25 / 50' },
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        onClick={() => handleChangeDistribution(ratio.id)}
                        className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${currentSlide.distribution === ratio.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                {/* Single Image Column Selector (Brand Constraint: Exactly 1 max) */}
                <span className="text-neutral-400 font-semibold px-1">Imagen a sangre:</span>
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                  <button
                    onClick={() => handleSetImageColumn(null, false)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${!currentSlide.columns?.some((c) => c.isFullBleedImage)
                        ? 'bg-neutral-700 text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                  >
                    Ninguna
                  </button>
                  {(currentSlide.columns || []).map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSetImageColumn(idx, false)}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${col.isFullBleedImage
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                      Col {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                {/* Change Column Count Button */}
                <button
                  onClick={() => setIsChoosingColumns(true)}
                  className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full font-medium flex items-center gap-1 cursor-pointer"
                  title="Cambiar número de columnas"
                >
                  <CaralIcon name="grid" size={14} />
                  <span>Columnas ({currentSlide.columnCount || 2})</span>
                </button>

                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />
              </>
            )}

            {currentSlide.type === 'resource' && (
              <>
                {/* Active Resource Indicator Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {currentSlide.resourceType === 'cover' ? 'Generador de Portadas' :
                      currentSlide.resourceType === 'connections' ? 'Diagrama de Conexiones' :
                        currentSlide.resourceType === 'deployment' ? 'Opciones de Despliegue' :
                          currentSlide.resourceType === 'deck' ? 'Generador de Deck' :
                            currentSlide.resourceType === 'origins-destinations' ? 'Listado de Orígenes y Destinos' : 'Recurso Crestone'}
                  </span>
                </div>

                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                {/* Cover Resource Toolbar Options */}
                {currentSlide.resourceType === 'cover' && (
                  <>
                    <span className="text-neutral-400 font-semibold px-1">Diagrama:</span>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                      {[
                        { id: '3d1o', label: '3d/1o' },
                        { id: '3d2o', label: '3d/2o' },
                        { id: '5d1o', label: '5d/1o' },
                        { id: '5d2o', label: '5d/2o' },
                        { id: '6d1o', label: '6d/1o' },
                        { id: '6d2o', label: '6d/2o' },
                        { id: '9d1o', label: '9d/1o' },
                        { id: '9d2o', label: '9d/2o' },
                      ].map((preset) => {
                        const currentBg = currentSlide.resourceConfig?.selectedBgId || '9d2o';
                        const isSelected = currentBg === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => updateCurrentSlide({
                              resourceConfig: { ...(currentSlide.resourceConfig || {}), selectedBgId: preset.id }
                            })}
                            className={`px-2 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    {/* Theme Toggle */}
                    <button
                      onClick={() => updateCurrentSlide({
                        resourceConfig: {
                          ...(currentSlide.resourceConfig || {}),
                          theme: (currentSlide.resourceConfig?.theme || 'dark') === 'dark' ? 'light' : 'dark'
                        }
                      })}
                      className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium flex items-center gap-1 cursor-pointer transition-all text-neutral-700 dark:text-neutral-200"
                      title="Alternar tema de portada"
                    >
                      <span>{(currentSlide.resourceConfig?.theme || 'dark') === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}</span>
                    </button>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    {/* Open Settings Drawer */}
                    <button
                      onClick={() => setResourceDrawerOpen(true)}
                      className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resourceDrawerOpen
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                      }`}
                      title="Configuración de portada (textos, logos, entorno)"
                    >
                      <CaralIcon name="gear" size={13} />
                      <span>Configuración</span>
                    </button>
                  </>
                )}

                {/* Connections Resource Toolbar Options */}
                {currentSlide.resourceType === 'connections' && (
                  <>
                    <span className="text-neutral-400 font-semibold px-1">Lienzo:</span>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                      {[
                        { id: 'light', label: 'Claro' },
                        { id: 'dark', label: 'Oscuro' },
                        { id: 'gradient', label: 'Gradiente' },
                      ].map((th) => {
                        const currentTh = currentSlide.resourceConfig?.bgTheme || 'light';
                        const isSelected = currentTh === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => updateCurrentSlide({
                              resourceConfig: { ...(currentSlide.resourceConfig || {}), bgTheme: th.id }
                            })}
                            className={`px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            {th.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    <button
                      onClick={() => setResourceDrawerOpen(true)}
                      className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resourceDrawerOpen
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <CaralIcon name="gear" size={13} />
                      <span>Configuración</span>
                    </button>
                  </>
                )}

                {/* Deployment Options Toolbar */}
                {currentSlide.resourceType === 'deployment' && (
                  <>
                    <span className="text-neutral-400 font-semibold px-1">Tema:</span>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                      {[
                        { id: 'light', label: 'Claro' },
                        { id: 'dark', label: 'Oscuro' },
                      ].map((th) => {
                        const currentTh = currentSlide.resourceConfig?.theme || 'light';
                        const isSelected = currentTh === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => updateCurrentSlide({
                              resourceConfig: { ...(currentSlide.resourceConfig || {}), theme: th.id }
                            })}
                            className={`px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            {th.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    <button
                      onClick={() => setResourceDrawerOpen(true)}
                      className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resourceDrawerOpen
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <CaralIcon name="gear" size={13} />
                      <span>Configuración</span>
                    </button>
                  </>
                )}

                {/* Deck Generator Toolbar */}
                {currentSlide.resourceType === 'deck' && (
                  <>
                    <span className="text-neutral-400 font-semibold px-1">Slide:</span>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                      {[
                        { id: 'cover', label: '1. Portada' },
                        { id: 'fullMatrix', label: '2. Completa' },
                        { id: 'clientMatrix', label: '3. Cliente' },
                        { id: 'compatibility', label: '4. Compatibilidad' },
                        { id: 'deployment', label: '5. Despliegue' },
                      ].map((tb) => {
                        const currentTb = currentSlide.resourceConfig?.deckTab || 'cover';
                        const isSelected = currentTb === tb.id;
                        return (
                          <button
                            key={tb.id}
                            onClick={() => updateCurrentSlide({
                              resourceConfig: { ...(currentSlide.resourceConfig || {}), deckTab: tb.id }
                            })}
                            className={`px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            {tb.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    <button
                      onClick={() => setResourceDrawerOpen(true)}
                      className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resourceDrawerOpen
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <CaralIcon name="gear" size={13} />
                      <span>Configuración</span>
                    </button>
                  </>
                )}

                {/* Origins & Destinations Toolbar */}
                {currentSlide.resourceType === 'origins-destinations' && (
                  <>
                    <span className="text-neutral-400 font-semibold px-1">Tema:</span>
                    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
                      {[
                        { id: 'light', label: 'Claro' },
                        { id: 'dark', label: 'Oscuro' },
                        { id: 'gradient', label: 'Gradiente' },
                        { id: 'transparent', label: 'Transparente' },
                      ].map((th) => {
                        const currentTh = currentSlide.resourceConfig?.theme || 'light';
                        const isSelected = currentTh === th.id;
                        return (
                          <button
                            key={th.id}
                            onClick={() => updateCurrentSlide({
                              resourceConfig: { ...(currentSlide.resourceConfig || {}), theme: th.id }
                            })}
                            className={`px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                          >
                            {th.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                    <button
                      onClick={() => setResourceDrawerOpen(true)}
                      className={`px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        resourceDrawerOpen
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <CaralIcon name="gear" size={13} />
                      <span>Configuración</span>
                    </button>
                  </>
                )}

                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

                {/* Change Resource Button */}
                <button
                  onClick={() => setIsResourceModalOpen(true)}
                  className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full font-medium flex items-center gap-1 cursor-pointer"
                  title="Cambiar a otra herramienta o recurso"
                >
                  <CaralIcon name="cube" size={13} />
                  <span>Cambiar Recurso</span>
                </button>

                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />
              </>
            )}

            {/* Slide Settings / Haz Button */}
            <button
              onClick={() => setRightSidebar({ open: true, blockType: 'slide' })}
              className={`px-3 py-1 rounded-full font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                rightSidebar?.open && rightSidebar.blockType === 'slide'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="Configuración de página y haz de luz"
            >
              <CaralIcon name="cube" size={14} />
              <span>Haz / Fondo {currentSlide.hazEffect ? `(Haz ${currentSlide.hazEffect})` : ''}</span>
            </button>
          </div>
        )}

        {/* Canvas Frame Wrapper ensuring strict 16:9 container */}
        <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
          {/* 16:9 Slide Canvas Frame */}
          <div
            className="w-full max-w-6xl xl:max-w-7xl max-h-full aspect-video bg-white dark:bg-neutral-950 rounded-2xl shadow-xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col relative overflow-hidden transition-all duration-300"
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

          {/* RENDER SLIDE CONTENT */}
          {currentSlide.type === 'empty' && !isChoosingColumns ? (
            /* INITIAL STATE: 2 CARDS (Figma Frame 847:8043) */
            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
              <div className="grid grid-cols-2 gap-6 max-w-lg w-full">
                {/* Card 1: En blanco */}
                <button
                  onClick={handleStartBlankFlow}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-4 text-neutral-600 dark:text-neutral-300 group-hover:text-blue-600 group-hover:scale-105 transition-all shadow-sm">
                    <CaralIcon name="file" size={28} />
                  </div>
                  <span className="font-bold text-base font-poppins text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                    En blanco
                  </span>
                  <span className="text-xs text-neutral-400 mt-1 text-center">
                    Elegir columnas y estructura visual
                  </span>
                </button>

                {/* Card 2: Usar recurso */}
                <button
                  onClick={() => setIsResourceModalOpen(true)}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-900/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-600 group-hover:scale-105 transition-all shadow-sm">
                    <CaralIcon name="cube" size={28} />
                  </div>
                  <span className="font-bold text-base font-poppins text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                    Usar recurso
                  </span>
                  <span className="text-xs text-neutral-400 mt-1 text-center">
                    Portadas, Diagramas y matrices de Crestone
                  </span>
                </button>
              </div>
            </div>
          ) : isChoosingColumns || currentSlide.type === 'empty' ? (
            /* STEP 1.1: COLUMN QUANTITY SELECTOR (Figma 848:8230) */
            <div className="flex-1 flex flex-col items-center justify-center p-10 animate-fade-in relative z-10">
              <h3 className="text-2xl font-bold font-poppins text-neutral-900 dark:text-neutral-100 mb-2 text-center">
                Elige la cantidad de columnas
              </h3>
              <p className="text-sm text-neutral-800 mb-8 text-center max-w-md">
                Estructura tu diapositiva dividiéndola en bloques modulares adaptables.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
                {/* 1 Columna */}
                <button
                  onClick={() => handleSelectColumnCount(1)}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-blue-50/20 transition-all group cursor-pointer"
                >
                  <div className="w-full h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 group-hover:border-blue-500 bg-white dark:bg-neutral-800 mb-3 flex items-center justify-center">
                    <div className="w-8 h-2 rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                    1 Columna
                  </span>
                  <span className="text-xs text-neutral-400 mt-1">Lienzo completo</span>
                </button>

                {/* 2 Columnas */}
                <button
                  onClick={() => handleSelectColumnCount(2)}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-blue-50/20 transition-all group cursor-pointer"
                >
                  <div className="w-full h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 group-hover:border-blue-500 bg-white dark:bg-neutral-800 mb-3 grid grid-cols-2 gap-1 p-1">
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                    2 Columnas
                  </span>
                  <span className="text-xs text-neutral-400 mt-1">Dividido 50/50</span>
                </button>

                {/* 3 Columnas */}
                <button
                  onClick={() => handleSelectColumnCount(3)}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-blue-50/20 transition-all group cursor-pointer"
                >
                  <div className="w-full h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 group-hover:border-blue-500 bg-white dark:bg-neutral-800 mb-3 grid grid-cols-3 gap-1 p-1">
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                    3 Columnas
                  </span>
                  <span className="text-xs text-neutral-400 mt-1">Triptico modular</span>
                </button>

                {/* 4 Columnas */}
                <button
                  onClick={() => handleSelectColumnCount(4)}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-blue-50/20 transition-all group cursor-pointer"
                >
                  <div className="w-full h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 group-hover:border-blue-500 bg-white dark:bg-neutral-800 mb-3 grid grid-cols-4 gap-1 p-1">
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                    <div className="h-full rounded bg-neutral-200 dark:bg-neutral-600 group-hover:bg-blue-400" />
                  </div>
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                    4 Columnas
                  </span>
                  <span className="text-xs text-neutral-400 mt-1">Matriz cuadrícula</span>
                </button>
              </div>

              {currentSlide.type !== 'empty' && (
                <button
                  onClick={() => setIsChoosingColumns(false)}
                  className="mt-6 text-sm text-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                >
                  Volver a la diapositiva
                </button>
              )}
            </div>
          ) : currentSlide.type === 'resource' ? (
            /* CRESTONE RESOURCE EMBED */
            <div className="w-full h-full relative overflow-hidden z-10 flex items-center justify-center">
              {currentSlide.resourceType === 'cover' && (
                <CoverGeneratorTool
                  isEmbedded
                  selectedBgId={currentSlide.resourceConfig?.selectedBgId || '9d2o'}
                  theme={currentSlide.resourceConfig?.theme || 'dark'}
                  coverTitle={currentSlide.resourceConfig?.coverTitle}
                  coverSubtitle={currentSlide.resourceConfig?.coverSubtitle}
                  coverTag={currentSlide.resourceConfig?.coverTag}
                  isDrawerOpen={resourceDrawerOpen}
                  onDrawerOpenChange={setResourceDrawerOpen}
                />
              )}
              {currentSlide.resourceType === 'connections' && (
                <ConnectionsDiagramTool
                  isEmbedded
                  bgTheme={currentSlide.resourceConfig?.bgTheme || 'light'}
                  activeDrawer={resourceDrawerOpen ? 'settings' : null}
                  onActiveDrawerChange={(d) => setResourceDrawerOpen(Boolean(d))}
                />
              )}
              {currentSlide.resourceType === 'deployment' && (
                <DeploymentOptionsTool
                  isEmbedded
                  theme={currentSlide.resourceConfig?.theme || 'light'}
                  isDrawerOpen={resourceDrawerOpen}
                  onDrawerOpenChange={setResourceDrawerOpen}
                />
              )}
              {currentSlide.resourceType === 'deck' && (
                <DeckGeneratorTool
                  isEmbedded
                  activeTab={currentSlide.resourceConfig?.deckTab || 'cover'}
                  onActiveTabChange={(tab) => updateCurrentSlide({
                    resourceConfig: { ...(currentSlide.resourceConfig || {}), deckTab: tab }
                  })}
                  theme={currentSlide.resourceConfig?.theme || 'light'}
                  isDrawerOpen={resourceDrawerOpen}
                  onDrawerOpenChange={setResourceDrawerOpen}
                />
              )}
              {currentSlide.resourceType === 'origins-destinations' && (
                <OriginsDestinationsTool
                  isEmbedded
                  theme={currentSlide.resourceConfig?.theme || 'light'}
                  activeDrawer={resourceDrawerOpen ? 'settings' : null}
                  onActiveDrawerChange={(d) => setResourceDrawerOpen(Boolean(d))}
                />
              )}
            </div>
          ) : (
            /* STEP 2 & 3: COLUMNS LAYOUT WITH DRAG & DROP AND FULL-BLEED IMAGE ENFORCEMENT */
            <div
              className="flex-1 grid h-full w-full relative z-10"
              style={{
                gridTemplateColumns: getGridTemplateColumns(),
              }}
            >
              {(currentSlide.columns || []).map((col, cIdx) => {
                const isImageCol = col.type === 'image' || col.isFullBleedImage;
                const isAutoHeight = col.heightMode === 'auto';
                const isLastCol = cIdx === (currentSlide.columns?.length || 1) - 1;
                const isOver = dragOverColIndex === cIdx;
                const blocks = col.blocks || [];

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
                    onDragOver={(e) => handleDragOver(e, cIdx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, cIdx)}
                    className={`h-full flex flex-col relative group/col transition-all ${isImageCol
                        ? 'p-0 overflow-hidden'
                        : `p-4 overflow-hidden ${isAutoHeight ? colVAlignClass : ''}`
                      } ${!isLastCol ? 'border-r border-dashed border-neutral-200/80 dark:border-neutral-800' : ''
                      } ${isOver ? 'ring-4 ring-inset ring-blue-500/40 bg-blue-50/20' : ''}`}
                  >
                    {isImageCol ? (
                      /* FULL-BLEED IMAGE BLOCK (NO MARGIN, EXTENDS TO BORDER) */
                      <div className="w-full h-full relative group flex items-center justify-center bg-neutral-50 dark:bg-neutral-900/60">
                        {col.imageUrl ? (
                          <>
                            <img
                              src={col.imageUrl}
                              alt="Col Media"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="light"
                                size="sm"
                                onClick={() => handleTriggerUpload(cIdx)}
                                iconName="image"
                              >
                                Cambiar
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUpdateColumn(cIdx, { imageUrl: '' })}
                                iconName="trash"
                              >
                                Quitar
                              </Button>
                            </div>
                          </>
                        ) : (
                          /* EMPTY FULL-BLEED IMAGE PLACEHOLDER (Figma 848:8563 Frame 8599) */
                          <button
                            onClick={() => handleTriggerUpload(cIdx)}
                            className="w-full h-full flex flex-col items-center justify-center p-8 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                          >
                            <div className="w-14 h-14 rounded-full bg-neutral-200/80 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 transition-all shadow-sm mb-3">
                              <CaralIcon name="plus" size={24} />
                            </div>
                            <span className="font-poppins font-medium text-sm text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600">
                              Agregar imagen
                            </span>
                            <span className="text-xs text-neutral-400 mt-1">
                              Imagen a sangre completa
                            </span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* CONTENT DROP ZONE / EDITABLE BLOCKS */
                      <div
                        className={`w-full flex flex-col ${isAutoHeight ? 'h-auto max-h-full' : 'h-full'
                          } ${colPaddingClass} ${colGlassClass} overflow-y-auto transition-all`}
                      >
                        <div className={`flex-1 flex flex-col w-full ${!isAutoHeight ? colVAlignClass : ''}`}>
                          <div className="space-y-4 w-full">
                            {blocks.length === 0 ? (
                              /* EMPTY DROP ZONE PLACEHOLDER */
                              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center my-auto min-h-[180px] bg-neutral-50/40 dark:bg-neutral-900/20">
                                <CaralIcon name="cube" size={26} classname="text-neutral-400 mb-2" />
                                <span className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                                  Arrastra o añade bloques aquí
                                </span>
                                <span className="text-[11px] text-neutral-400 mt-0.5 max-w-xs">
                                  Arrastra Títulos, Párrafos o Bloques Explicativos desde "Recursos"
                                </span>

                                <div className="flex items-center flex-wrap gap-1.5 mt-3 justify-center">
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'title')}
                                    className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                  >
                                    <span className="font-bold">H1</span>
                                    <span>+ Título</span>
                                  </button>
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'explicativo')}
                                    className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                  >
                                    <CaralIcon name="rigthJoinW" size={12} />
                                    <span>+ Explicativo</span>
                                  </button>
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'paragraph')}
                                    className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                  >
                                    <span>+ Párrafo</span>
                                  </button>
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'image')}
                                    className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/80 hover:border-blue-500 hover:text-blue-600 text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                                  >
                                    <CaralIcon name="image" size={12} />
                                    <span>+ Imagen</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* LIST OF DROPPED BLOCKS */
                              <div className="space-y-4 w-full">
                                {blocks.map((block) => {
                                  const isSelected = selectedBlockId === block.id;

                                  return (
                                    <div
                                      key={block.id}
                                      onClick={() => {
                                        setSelectedBlockId(block.id);
                                        if (block.type === 'explicativo') {
                                          setRightSidebar({
                                            open: true,
                                            blockType: 'explicativo',
                                            targetColIndex: cIdx,
                                            targetBlockId: block.id,
                                          });
                                        }
                                      }}
                                      className={`group relative rounded-xl p-3 transition-all cursor-pointer border ${isSelected
                                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm'
                                          : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30'
                                        }`}
                                    >
                                      <div className="flex items-center justify-between mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                          {block.type === 'title'
                                            ? 'H1 Título'
                                            : block.type === 'explicativo'
                                              ? 'Bloque Explicativo'
                                              : block.type === 'image'
                                                ? 'Bloque Imagen'
                                                : 'Párrafo'}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBlock(cIdx, block.id);
                                          }}
                                          className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer"
                                          title="Eliminar bloque"
                                        >
                                          <CaralIcon name="trash" size={12} />
                                        </button>
                                      </div>

                                      {block.type === 'title' ? (
                                        <input
                                          type="text"
                                          value={block.content || block.title || ''}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBlockId(block.id);
                                            setRightSidebar({
                                              open: true,
                                              blockType: 'text',
                                              targetColIndex: cIdx,
                                              targetBlockId: block.id,
                                            });
                                          }}
                                          onChange={(e) =>
                                            handleUpdateBlockField(cIdx, block.id, {
                                              content: e.target.value,
                                              title: e.target.value,
                                            })
                                          }
                                          style={getBlockInlineStyle(block.style, 28)}
                                          placeholder="Escribe el título aquí..."
                                          className="w-full text-2xl xl:text-3xl font-bold font-poppins bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-neutral-900 dark:text-neutral-100"
                                        />
                                      ) : block.type === 'explicativo' ? (
                                        /* BLOQUE EXPLICATIVO (Figma 843:7203) */
                                        <div className="flex items-start gap-3">
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedBlockId(block.id);
                                              setRightSidebar({
                                                open: true,
                                                blockType: 'explicativo',
                                                targetColIndex: cIdx,
                                                targetBlockId: block.id,
                                              });
                                              setIsIconPickerOpen(true);
                                            }}
                                            className="flex-shrink-0 mt-0.5 text-neutral-800 dark:text-neutral-200 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                                            title="Cambiar ícono"
                                          >
                                            <CaralIcon
                                              name={(block.icon as any) || 'settings'}
                                              size={
                                                block.size === 'large' ? 24 : block.size === 'small' ? 18 : 20
                                              }
                                            />
                                          </div>

                                          <div className="flex-1 space-y-1">
                                            <input
                                              type="text"
                                              value={block.title ?? block.content ?? ''}
                                              onChange={(e) =>
                                                handleUpdateBlockField(cIdx, block.id, {
                                                  title: e.target.value,
                                                })
                                              }
                                              style={getBlockInlineStyle(block.style, 18)}
                                              placeholder="Título del beneficio o punto clave..."
                                              className="w-full text-base xl:text-lg font-bold font-poppins bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-neutral-900 dark:text-neutral-100"
                                            />
                                            <textarea
                                              value={block.description ?? ''}
                                              onChange={(e) =>
                                                handleUpdateBlockField(cIdx, block.id, {
                                                  description: e.target.value,
                                                })
                                              }
                                              placeholder="Descripción o detalles..."
                                              rows={2}
                                              className="w-full text-xs xl:text-sm text-neutral-600 dark:text-neutral-400 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 resize-none leading-relaxed"
                                            />
                                          </div>
                                        </div>
                                      ) : block.type === 'image' ? (
                                        /* BLOQUE DE IMAGEN */
                                        <div
                                          className={`w-full flex ${block.imageAlign === 'left'
                                              ? 'justify-start'
                                              : block.imageAlign === 'right'
                                                ? 'justify-end'
                                                : 'justify-center'
                                            }`}
                                        >
                                          <div
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedBlockId(block.id);
                                              setRightSidebar({
                                                open: true,
                                                blockType: 'image',
                                                targetColIndex: cIdx,
                                                targetBlockId: block.id,
                                              });
                                            }}
                                            style={{
                                              width:
                                                block.imageSize === '25'
                                                  ? '25%'
                                                  : block.imageSize === '50'
                                                    ? '50%'
                                                    : block.imageSize === '75'
                                                      ? '75%'
                                                      : '100%',
                                              padding:
                                                block.imagePadding === '25'
                                                  ? '25px'
                                                  : block.imagePadding === '10'
                                                    ? '10px'
                                                    : '0px',
                                            }}
                                            className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 min-h-[120px] flex items-center justify-center relative group/img cursor-pointer transition-all shadow-sm"
                                          >
                                            {block.imageUrl ? (
                                              <>
                                                <img
                                                  src={block.imageUrl}
                                                  alt={block.title || 'Imagen del bloque'}
                                                  className={`w-full h-auto max-h-[360px] object-cover ${block.imagePadding && block.imagePadding !== '0'
                                                      ? 'rounded-lg shadow-sm'
                                                      : 'rounded-xl'
                                                    }`}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedBlockId(block.id);
                                                      setRightSidebar({
                                                        open: true,
                                                        blockType: 'image',
                                                        targetColIndex: cIdx,
                                                        targetBlockId: block.id,
                                                      });
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-neutral-800/95 text-neutral-900 dark:text-neutral-100 text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-white cursor-pointer"
                                                  >
                                                    <CaralIcon name="image" size={14} />
                                                    <span>Cambiar</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeleteBlock(cIdx, block.id);
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-red-700 cursor-pointer"
                                                  >
                                                    <CaralIcon name="trash" size={14} />
                                                    <span>Eliminar</span>
                                                  </button>
                                                </div>
                                              </>
                                            ) : (
                                              <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-400 hover:text-blue-500 transition-colors">
                                                <CaralIcon name="image" size={32} classname="mb-2 text-neutral-400" />
                                                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                  Haz clic para agregar una imagen
                                                </span>
                                                <span className="text-[10px] text-neutral-400 mt-0.5">
                                                  Carga desde tu equipo o pega una URL
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <textarea
                                          value={block.content || block.description || ''}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedBlockId(block.id);
                                            setRightSidebar({
                                              open: true,
                                              blockType: 'text',
                                              targetColIndex: cIdx,
                                              targetBlockId: block.id,
                                            });
                                          }}
                                          onChange={(e) =>
                                            handleUpdateBlockField(cIdx, block.id, {
                                              content: e.target.value,
                                              description: e.target.value,
                                            })
                                          }
                                          style={getBlockInlineStyle(block.style, 16)}
                                          placeholder="Escribe el texto explicativo o puntos clave..."
                                          rows={3}
                                          className="w-full text-sm xl:text-base bg-transparent border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 focus:border-blue-500 rounded-lg p-2 focus:outline-none resize-none text-neutral-700 dark:text-neutral-300 leading-relaxed"
                                        />
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Quick add more buttons */}
                                <div className="flex items-center gap-1.5 pt-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'title')}
                                    className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-neutral-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 hover:text-blue-600 text-[11px] font-medium border border-neutral-200/50 dark:border-neutral-700/50 transition-colors cursor-pointer"
                                  >
                                    + Título
                                  </button>
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'explicativo')}
                                    className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-neutral-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 hover:text-blue-600 text-[11px] font-medium border border-neutral-200/50 dark:border-neutral-700/50 transition-colors cursor-pointer"
                                  >
                                    + Explicativo
                                  </button>
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'paragraph')}
                                    className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-neutral-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 hover:text-blue-600 text-[11px] font-medium border border-neutral-200/50 dark:border-neutral-700/50 transition-colors cursor-pointer"
                                  >
                                    + Párrafo
                                  </button>
                                  <button
                                    onClick={() => handleAddBlockToColumn(cIdx, 'image')}
                                    className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-neutral-800/70 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-neutral-800 hover:text-blue-600 text-[11px] font-medium border border-neutral-200/50 dark:border-neutral-700/50 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <CaralIcon name="image" size={11} />
                                    <span>+ Imagen</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column footer indicator / quick config */}
                        <div className="pt-2 flex items-center justify-between text-xs text-neutral-400 opacity-40 group-hover/col:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBlockId(null);
                              setRightSidebar({
                                open: true,
                                blockType: 'column',
                                targetColIndex: cIdx,
                              });
                            }}
                            className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs transition-colors cursor-pointer"
                            title="Configurar alineación vertical, padding y efecto vidrio de la columna"
                          >
                            <CaralIcon name="gear" size={12} />
                            <span>Columna {cIdx + 1}</span>
                          </button>
                          <button
                            onClick={() => handleSetImageColumn(cIdx)}
                            className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium text-[11px] transition-colors cursor-pointer bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs"
                            title="Estilo de marca: Máximo 1 columna con imagen a sangre por diapositiva"
                          >
                            <CaralIcon name="image" size={12} />
                            <span>Hacer Imagen a Sangre</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 4. Right Sidebar: Inspector / Image Picker / Bloque Explicativo / Formato de Texto / Diapositiva */}
      {rightSidebar?.open && (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col z-20 shadow-xl animate-fade-in">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-bold text-sm font-poppins text-neutral-800 dark:text-neutral-200">
              {rightSidebar.blockType === 'slide' || rightSidebar.blockType === 'page'
                ? 'Configuración de Diapositiva'
                : rightSidebar.blockType === 'column'
                  ? `Configurar Columna ${(rightSidebar.targetColIndex ?? 0) + 1}`
                  : rightSidebar.blockType === 'image'
                    ? rightSidebar.targetBlockId
                      ? 'Configurar imagen de bloque'
                      : 'Agregar Imagen a Sangre'
                    : rightSidebar.blockType === 'explicativo'
                      ? 'Bloque explicativo'
                      : 'Formato de texto'}
            </span>
            <div className="flex items-center gap-1">
              {rightSidebar.targetBlockId && rightSidebar.targetColIndex !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      rightSidebar.targetColIndex !== undefined &&
                      rightSidebar.targetBlockId
                    ) {
                      handleDeleteBlock(
                        rightSidebar.targetColIndex,
                        rightSidebar.targetBlockId
                      );
                    }
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Eliminar elemento"
                >
                  <CaralIcon name="trash" size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  setRightSidebar(null);
                  setActiveColorPicker(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                title="Cerrar"
              >
                <CaralIcon name="closeSidebarLeft" size={18} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {rightSidebar.blockType === 'slide' || rightSidebar.blockType === 'page' ? (
              /* CONFIGURACIÓN DE DIAPOSITIVA / PÁGINA (HAZ DE LUZ Y POSICIÓN) */
              <div className="space-y-6 animate-fade-in select-none">
                {/* 1. Selector de Haz de luz */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Haz de Luz (Fondo)
                    </span>
                    {currentSlide.hazEffect ? (
                      <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                        Haz {currentSlide.hazEffect} activo
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400">Sin haz</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {HAZ_PRESETS.map((haz) => {
                      const isSelected = currentSlide.hazEffect === haz.id;
                      return (
                        <button
                          key={haz.id}
                          type="button"
                          onClick={() => handleSelectHaz(haz.id)}
                          className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col gap-1.5 cursor-pointer group ${
                            isSelected
                              ? 'border-2 border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/50 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50'
                          }`}
                        >
                          <div className="w-full h-12 rounded-lg bg-neutral-950 flex items-center justify-center overflow-hidden relative border border-neutral-800/80">
                            <img
                              src={haz.src}
                              alt={haz.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shadow">
                                ✓
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                            {haz.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {currentSlide.hazEffect && (
                    <button
                      type="button"
                      onClick={handleRemoveHaz}
                      className="mt-2.5 w-full py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100/60 dark:hover:bg-red-900/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CaralIcon name="trash" size={13} />
                      <span>Quitar Haz de luz</span>
                    </button>
                  )}
                </div>

                {/* 2. Posición del Haz (Centro y Esquinas) */}
                {currentSlide.hazEffect && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Posición del Haz
                      </span>
                      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    {/* Visual 3x3 Compass Grid */}
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center gap-2 mb-3">
                      <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
                        {/* Top-Left */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('top-left')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            (currentSlide.hazPosition || 'center') === 'top-left'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Superior Izquierda"
                        >
                          ↖
                        </button>

                        {/* Top */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('top')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            currentSlide.hazPosition === 'top'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Superior Centro"
                        >
                          ↑
                        </button>

                        {/* Top-Right */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('top-right')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            currentSlide.hazPosition === 'top-right'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Superior Derecha"
                        >
                          ↗
                        </button>

                        {/* Center spacer */}
                        <div className="h-11 flex items-center justify-center text-neutral-300 dark:text-neutral-700 text-xs">
                          •
                        </div>

                        {/* Center */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('center')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            (currentSlide.hazPosition || 'center') === 'center'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Centro"
                        >
                          ⊙
                        </button>

                        {/* Center spacer */}
                        <div className="h-11 flex items-center justify-center text-neutral-300 dark:text-neutral-700 text-xs">
                          •
                        </div>

                        {/* Bottom-Left */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('bottom-left')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            currentSlide.hazPosition === 'bottom-left'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Inferior Izquierda"
                        >
                          ↙
                        </button>

                        {/* Bottom */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('bottom')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            currentSlide.hazPosition === 'bottom'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Inferior Centro"
                        >
                          ↓
                        </button>

                        {/* Bottom-Right */}
                        <button
                          type="button"
                          onClick={() => handleSelectHazPosition('bottom-right')}
                          className={`h-11 rounded-xl border flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                            currentSlide.hazPosition === 'bottom-right'
                              ? 'border-2 border-blue-500 bg-blue-500 text-white shadow-md'
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900'
                          }`}
                          title="Inferior Derecha"
                        >
                          ↘
                        </button>
                      </div>
                    </div>

                    {/* Position list buttons */}
                    <div className="space-y-1.5">
                      {HAZ_POSITIONS.map((pos) => {
                        const isPosActive = (currentSlide.hazPosition || 'center') === pos.id;
                        return (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => handleSelectHazPosition(pos.id)}
                            className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                              isPosActive
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{pos.icon}</span>
                              <span>{pos.label}</span>
                            </div>
                            {isPosActive && (
                              <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                                Activo
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : rightSidebar.blockType === 'column' ? (
              /* CONFIGURACIÓN DE COLUMNA: DISPOSICIÓN VERTICAL, PADDING Y EFECTO VIDRIO */
              (() => {
                const targetCol =
                  rightSidebar.targetColIndex !== undefined
                    ? currentSlide.columns?.[rightSidebar.targetColIndex]
                    : null;
                const currentColVAlign = targetCol?.verticalAlign || 'top';
                const currentHeightMode = targetCol?.heightMode || 'full';
                const currentColPadding = targetCol?.padding || '25';
                const currentGlass = !!targetCol?.glassEffect;

                return (
                  <div className="space-y-6 animate-fade-in select-none">
                    {/* 1. Alto de la Columna */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Alto de la Columna
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (rightSidebar.targetColIndex !== undefined) {
                              handleUpdateColumn(rightSidebar.targetColIndex, {
                                heightMode: 'full',
                              });
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer gap-1.5 ${currentHeightMode === 'full'
                              ? 'border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900'
                            }`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="3" width="14" height="18" rx="2"></rect>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                            <line x1="15" y1="3" x2="15" y2="21"></line>
                          </svg>
                          <span className="text-[11px] font-semibold">Contenedor</span>
                          <span className="text-[9px] text-neutral-400">100% Alto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (rightSidebar.targetColIndex !== undefined) {
                              handleUpdateColumn(rightSidebar.targetColIndex, {
                                heightMode: 'auto',
                              });
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer gap-1.5 ${currentHeightMode === 'auto'
                              ? 'border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900'
                            }`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="7" width="14" height="10" rx="2"></rect>
                            <line x1="9" y1="12" x2="15" y2="12"></line>
                          </svg>
                          <span className="text-[11px] font-semibold">Al Contenido</span>
                          <span className="text-[9px] text-neutral-400">Ajuste automático</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Disposición Vertical */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Disposición Vertical
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            id: 'top',
                            label: 'Superior',
                            icon: (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="4" x2="20" y2="4"></line>
                                <rect x="7" y="8" width="10" height="6" rx="1"></rect>
                                <rect x="9" y="16" width="6" height="4" rx="1"></rect>
                              </svg>
                            ),
                          },
                          {
                            id: 'center',
                            label: 'Centro',
                            icon: (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <rect x="7" y="5" width="10" height="5" rx="1"></rect>
                                <rect x="7" y="14" width="10" height="5" rx="1"></rect>
                              </svg>
                            ),
                          },
                          {
                            id: 'bottom',
                            label: 'Inferior',
                            icon: (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="20" x2="20" y2="20"></line>
                                <rect x="7" y="10" width="10" height="6" rx="1"></rect>
                                <rect x="9" y="4" width="6" height="4" rx="1"></rect>
                              </svg>
                            ),
                          },
                        ].map((v) => {
                          const isCurrent = currentColVAlign === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                if (rightSidebar.targetColIndex !== undefined) {
                                  handleUpdateColumn(rightSidebar.targetColIndex, {
                                    verticalAlign: v.id as 'top' | 'center' | 'bottom',
                                  });
                                }
                              }}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer gap-1.5 ${isCurrent
                                  ? 'border-2 border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900'
                                }`}
                            >
                              {v.icon}
                              <span className="text-[11px] font-semibold">{v.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Espaciado interior (Padding) */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Espaciado de Columna (Padding)
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        {(['0', '10', '25', '40'] as const).map((p) => {
                          const isCurrent = currentColPadding === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                if (rightSidebar.targetColIndex !== undefined) {
                                  handleUpdateColumn(rightSidebar.targetColIndex, {
                                    padding: p,
                                  });
                                }
                              }}
                              className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isCurrent
                                  ? 'bg-white dark:bg-neutral-800 text-blue-600 shadow-sm border border-neutral-200/80 dark:border-neutral-700'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                }`}
                            >
                              {p}px
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Desenfocar fondo / Efecto Vidrio (Glassmorphism) */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          Efecto Vidrio (Glassmorphism)
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                      <div
                        onClick={() => {
                          if (rightSidebar.targetColIndex !== undefined) {
                            handleUpdateColumn(rightSidebar.targetColIndex, {
                              glassEffect: !currentGlass,
                            });
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${currentGlass
                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-950/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${currentGlass
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                              }`}
                          >
                            <CaralIcon name="cube" size={20} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                              Desenfocar Fondo
                            </span>
                            <span className="text-[10px] text-neutral-800 dark:text-neutral-400">
                              Fondo translúcido con desenfoque
                            </span>
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <div
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${currentGlass ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
                            }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${currentGlass ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : rightSidebar.blockType === 'image' ? (
              (() => {
                const targetBlock =
                  rightSidebar.targetColIndex !== undefined && rightSidebar.targetBlockId
                    ? currentSlide.columns?.[rightSidebar.targetColIndex]?.blocks?.find(
                      (b) => b.id === rightSidebar.targetBlockId
                    )
                    : null;
                const currentImgUrl = targetBlock
                  ? targetBlock.imageUrl || ''
                  : (rightSidebar.targetColIndex !== undefined
                    ? currentSlide.columns?.[rightSidebar.targetColIndex]?.imageUrl || ''
                    : '');

                const updateImage = (url: string) => {
                  if (rightSidebar.targetColIndex !== undefined) {
                    if (rightSidebar.targetBlockId) {
                      handleUpdateBlockField(
                        rightSidebar.targetColIndex,
                        rightSidebar.targetBlockId,
                        { imageUrl: url }
                      );
                    } else {
                      handleUpdateColumn(rightSidebar.targetColIndex, {
                        imageUrl: url,
                        type: 'image',
                        isFullBleedImage: true,
                      });
                    }
                  }
                };

                return (
                  <div className="space-y-5 animate-fade-in select-none">
                    {/* Size Selector for Block Image */}
                    {rightSidebar.targetBlockId && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Tamaño de imagen
                          </span>
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                          {(['25', '50', '75', '100'] as const).map((sz) => {
                            const isCurrent = (targetBlock?.imageSize || '100') === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  if (
                                    rightSidebar.targetColIndex !== undefined &&
                                    rightSidebar.targetBlockId
                                  ) {
                                    handleUpdateBlockField(
                                      rightSidebar.targetColIndex,
                                      rightSidebar.targetBlockId,
                                      { imageSize: sz }
                                    );
                                  }
                                }}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isCurrent
                                    ? 'bg-white dark:bg-neutral-800 text-blue-600 shadow-sm border border-neutral-200/80 dark:border-neutral-700'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                  }`}
                              >
                                {sz}%
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Alignment Selector for Block Image */}
                    {rightSidebar.targetBlockId && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Alineación
                          </span>
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            {
                              id: 'left',
                              label: 'Izquierda',
                              icon: (
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="17" y1="10" x2="3" y2="10"></line>
                                  <line x1="21" y1="6" x2="3" y2="6"></line>
                                  <line x1="21" y1="14" x2="3" y2="14"></line>
                                  <line x1="17" y1="18" x2="3" y2="18"></line>
                                </svg>
                              ),
                            },
                            {
                              id: 'center',
                              label: 'Centro',
                              icon: (
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="18" y1="10" x2="6" y2="10"></line>
                                  <line x1="21" y1="6" x2="3" y2="6"></line>
                                  <line x1="21" y1="14" x2="3" y2="14"></line>
                                  <line x1="18" y1="18" x2="6" y2="18"></line>
                                </svg>
                              ),
                            },
                            {
                              id: 'right',
                              label: 'Derecha',
                              icon: (
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="21" y1="10" x2="7" y2="10"></line>
                                  <line x1="21" y1="6" x2="3" y2="6"></line>
                                  <line x1="21" y1="14" x2="3" y2="14"></line>
                                  <line x1="21" y1="18" x2="7" y2="18"></line>
                                </svg>
                              ),
                            },
                          ] as const).map((al) => {
                            const isCurrent =
                              (targetBlock?.imageAlign || 'center') === al.id;
                            return (
                              <button
                                key={al.id}
                                type="button"
                                onClick={() => {
                                  if (
                                    rightSidebar.targetColIndex !== undefined &&
                                    rightSidebar.targetBlockId
                                  ) {
                                    handleUpdateBlockField(
                                      rightSidebar.targetColIndex,
                                      rightSidebar.targetBlockId,
                                      { imageAlign: al.id }
                                    );
                                  }
                                }}
                                className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isCurrent
                                    ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                  }`}
                                title={al.label}
                              >
                                {al.icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Padding Selector for Block Image (0px, 10px, 25px) */}
                    {rightSidebar.targetBlockId && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Espaciado (Padding)
                          </span>
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                          {(['0', '10', '25'] as const).map((pad) => {
                            const isCurrent = (targetBlock?.imagePadding || '0') === pad;
                            return (
                              <button
                                key={pad}
                                type="button"
                                onClick={() => {
                                  if (
                                    rightSidebar.targetColIndex !== undefined &&
                                    rightSidebar.targetBlockId
                                  ) {
                                    handleUpdateBlockField(
                                      rightSidebar.targetColIndex,
                                      rightSidebar.targetBlockId,
                                      { imagePadding: pad }
                                    );
                                  }
                                }}
                                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isCurrent
                                    ? 'bg-white dark:bg-neutral-800 text-blue-600 shadow-sm border border-neutral-200/80 dark:border-neutral-700'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                                  }`}
                              >
                                {pad}px
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Click to upload from computer */}
                    <div
                      onClick={() => {
                        if (rightSidebar.targetColIndex !== undefined) {
                          setActiveColumnForUpload(rightSidebar.targetColIndex);
                        }
                        fileInputRef.current?.click();
                      }}
                      className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer bg-neutral-50 dark:bg-neutral-800/50 group"
                    >
                      <CaralIcon
                        name="arrowUpToLine"
                        size={26}
                        classname="text-blue-500 mb-1.5 group-hover:scale-110 transition-transform"
                      />
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        Cargar desde mi equipo
                      </span>
                      <span className="text-[11px] text-neutral-400 mt-0.5">PNG, JPG, WebP hasta 10MB</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        O pegar URL de la Imagen
                      </label>
                      <input
                        type="text"
                        value={currentImgUrl}
                        onChange={(e) => updateImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Preset Sample Images */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        Imágenes corporativas
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            title: 'Tecnología',
                            url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
                          },
                          {
                            title: 'Analítica',
                            url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
                          },
                          {
                            title: 'Negocios',
                            url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
                          },
                          {
                            title: 'Cloud Data',
                            url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
                          },
                        ].map((sample, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => updateImage(sample.url)}
                            className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group text-left aspect-video cursor-pointer"
                          >
                            <img
                              src={sample.url}
                              alt={sample.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                              <span className="text-[10px] text-white font-medium">
                                {sample.title}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Delete button if block */}
                    {rightSidebar.targetBlockId && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              rightSidebar.targetColIndex !== undefined &&
                              rightSidebar.targetBlockId
                            ) {
                              handleDeleteBlock(
                                rightSidebar.targetColIndex,
                                rightSidebar.targetBlockId
                              );
                            }
                          }}
                          className="w-full h-10 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/80 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                        >
                          <CaralIcon name="trash" size={15} />
                          <span>Eliminar bloque de imagen</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : rightSidebar.blockType === 'explicativo' ? (
              /* BLOQUE EXPLICATIVO INSPECTOR (Figma 843:7203) */
              (() => {
                const targetBlock =
                  rightSidebar.targetColIndex !== undefined
                    ? currentSlide.columns?.[rightSidebar.targetColIndex]?.blocks?.find(
                      (b) => b.id === rightSidebar.targetBlockId
                    )
                    : null;

                return (
                  <div className="space-y-5 animate-fade-in">
                    {/* Icon selector button */}
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsIconPickerOpen(true)}
                          className="w-11 h-11 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center flex-shrink-0 shadow-sm hover:scale-105 transition-all cursor-pointer"
                          title="Seleccionar ícono"
                        >
                          <CaralIcon
                            name={(targetBlock?.icon as any) || 'settings'}
                            size={20}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsIconPickerOpen(true)}
                          className="flex-1 h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:border-blue-500 hover:bg-blue-50/30 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <span>Seleccionar icono</span>
                        </button>
                      </div>
                    </div>

                    {/* Tamaño selector */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Tamaño
                      </label>
                      <select
                        value={targetBlock?.size || 'medium'}
                        onChange={(e) => {
                          if (
                            rightSidebar.targetColIndex !== undefined &&
                            rightSidebar.targetBlockId
                          ) {
                            handleUpdateBlockField(
                              rightSidebar.targetColIndex,
                              rightSidebar.targetBlockId,
                              {
                                size: e.target.value as 'small' | 'medium' | 'large',
                              }
                            );
                          }
                        }}
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="small">Pequeño</option>
                        <option value="medium">Mediano</option>
                        <option value="large">Grande</option>
                      </select>
                    </div>

                    {/* Título input */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Título
                      </label>
                      <input
                        type="text"
                        value={targetBlock?.title ?? ''}
                        onChange={(e) => {
                          if (
                            rightSidebar.targetColIndex !== undefined &&
                            rightSidebar.targetBlockId
                          ) {
                            handleUpdateBlockField(
                              rightSidebar.targetColIndex,
                              rightSidebar.targetBlockId,
                              {
                                title: e.target.value,
                              }
                            );
                          }
                        }}
                        placeholder="Mejora de la eficiencia operativa"
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Descripción textarea */}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Descripción
                      </label>
                      <textarea
                        value={targetBlock?.description ?? ''}
                        onChange={(e) => {
                          if (
                            rightSidebar.targetColIndex !== undefined &&
                            rightSidebar.targetBlockId
                          ) {
                            handleUpdateBlockField(
                              rightSidebar.targetColIndex,
                              rightSidebar.targetBlockId,
                              {
                                description: e.target.value,
                              }
                            );
                          }
                        }}
                        placeholder="Automatiza los procesos de integración y exportación de datos, reduciendo las tareas manuales y minimizando los errores humanos"
                        rows={5}
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                      />
                    </div>

                    {/* Delete button action */}
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            rightSidebar.targetColIndex !== undefined &&
                            rightSidebar.targetBlockId
                          ) {
                            handleDeleteBlock(
                              rightSidebar.targetColIndex,
                              rightSidebar.targetBlockId
                            );
                          }
                        }}
                        className="w-full h-10 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/80 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <CaralIcon name="trash" size={15} />
                        <span>Eliminar bloque explicativo</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : rightSidebar.blockType === 'text' ? (
              /* FORMATO DE TEXTO INSPECTOR (Paleta Caral) */
              (() => {
                const targetBlock =
                  rightSidebar.targetColIndex !== undefined
                    ? currentSlide.columns?.[rightSidebar.targetColIndex]?.blocks?.find(
                      (b) => b.id === rightSidebar.targetBlockId
                    )
                    : null;

                const style: TextStyle = targetBlock?.style || {};
                const currentFontWeight =
                  style.fontWeight || (targetBlock?.type === 'title' ? '700' : '400');
                const currentFontSize =
                  style.fontSize || (targetBlock?.type === 'title' ? 28 : 16);
                const currentTextColor = style.color || '#18181B';
                const currentBgColor = style.backgroundColor || 'transparent';
                const currentAlign = style.align || 'left';

                const updateStyle = (patch: Partial<TextStyle>) => {
                  if (
                    rightSidebar.targetColIndex !== undefined &&
                    rightSidebar.targetBlockId
                  ) {
                    handleUpdateBlockField(
                      rightSidebar.targetColIndex,
                      rightSidebar.targetBlockId,
                      {
                        style: { ...style, ...patch },
                      }
                    );
                  }
                };

                return (
                  <div className="space-y-6 animate-fade-in select-none">
                    {/* 1. Font weight & Font size row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Font weight */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-800 dark:text-neutral-400 mb-1.5">
                          Font weight
                        </label>
                        <select
                          value={currentFontWeight}
                          onChange={(e) => updateStyle({ fontWeight: e.target.value })}
                          className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                        >
                          <option value="400">Regular</option>
                          <option value="500">Medium</option>
                          <option value="600">SemiBold</option>
                          <option value="700">Bold</option>
                          <option value="800">ExtraBold</option>
                          <option value="900">Black</option>
                        </select>
                      </div>

                      {/* Font size */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-800 dark:text-neutral-400 mb-1.5">
                          Font size
                        </label>
                        <div className="flex items-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-sm">
                          <input
                            type="number"
                            min={10}
                            max={120}
                            value={currentFontSize}
                            onChange={(e) =>
                              updateStyle({ fontSize: parseInt(e.target.value) || 16 })
                            }
                            className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium"
                          />
                          <div className="flex flex-col -mr-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateStyle({ fontSize: Math.min(120, currentFontSize + 2) })
                              }
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                            >
                              <CaralIcon name="chevronUp" size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateStyle({ fontSize: Math.max(10, currentFontSize - 2) })
                              }
                              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                            >
                              <CaralIcon name="chevronDown" size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Color Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-400">
                          Color
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>

                      <div className="space-y-3">
                        {/* Text Color */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Text
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveColorPicker(
                                  activeColorPicker === 'text' ? null : 'text'
                                )
                              }
                              className="w-20 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-inner flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                              style={{ backgroundColor: currentTextColor }}
                              title="Elegir color de texto de marca Caral"
                            />

                            {/* Popover Caral Color Palette */}
                            {activeColorPicker === 'text' && (
                              <div className="absolute right-0 top-10 z-50 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-60 animate-in fade-in zoom-in-95">
                                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                                  Colores de Marca Caral
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {CARAL_COLORS.map((c) => (
                                    <button
                                      key={c.hex}
                                      type="button"
                                      onClick={() => {
                                        updateStyle({ color: c.hex });
                                        setActiveColorPicker(null);
                                      }}
                                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${currentTextColor === c.hex
                                          ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent'
                                          : 'border-neutral-300 dark:border-neutral-700'
                                        }`}
                                      style={{ backgroundColor: c.hex }}
                                      title={`${c.name} (${c.role})`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Background Color */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Background
                          </span>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveColorPicker(
                                  activeColorPicker === 'bg' ? null : 'bg'
                                )
                              }
                              className="w-20 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-inner relative overflow-hidden transition-transform hover:scale-105 cursor-pointer"
                              style={{
                                backgroundColor:
                                  currentBgColor === 'transparent' ? '#FFFFFF' : currentBgColor,
                              }}
                              title="Elegir color de fondo de texto de marca Caral"
                            >
                              {(!currentBgColor || currentBgColor === 'transparent') && (
                                <div className="absolute inset-0 border-t border-neutral-400 -rotate-12 translate-y-3.5" />
                              )}
                            </button>

                            {/* Popover Caral Color Palette */}
                            {activeColorPicker === 'bg' && (
                              <div className="absolute right-0 top-10 z-50 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-60 animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                                    Fondo de Texto Caral
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateStyle({ backgroundColor: 'transparent' });
                                      setActiveColorPicker(null);
                                    }}
                                    className="text-[10px] text-blue-500 hover:underline font-semibold cursor-pointer"
                                  >
                                    Sin fondo
                                  </button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                  {CARAL_COLORS.map((c) => (
                                    <button
                                      key={c.hex}
                                      type="button"
                                      onClick={() => {
                                        updateStyle({ backgroundColor: c.hex });
                                        setActiveColorPicker(null);
                                      }}
                                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${currentBgColor === c.hex
                                          ? 'ring-2 ring-blue-500 ring-offset-2 border-transparent'
                                          : 'border-neutral-300 dark:border-neutral-700'
                                        }`}
                                      style={{ backgroundColor: c.hex }}
                                      title={`${c.name} (${c.role})`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. Format Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-400">
                          Format
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>

                      <div className="space-y-2.5">
                        {/* Row 1: B, I, U, S */}
                        <div className="grid grid-cols-4 gap-2">
                          {/* Bold */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStyle({
                                fontWeight: currentFontWeight === '700' ? '400' : '700',
                              })
                            }
                            className={`h-10 rounded-xl border flex items-center justify-center font-bold text-base transition-all cursor-pointer ${currentFontWeight === '700' ||
                                currentFontWeight === '800' ||
                                currentFontWeight === '900'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                          >
                            B
                          </button>

                          {/* Italic */}
                          <button
                            type="button"
                            onClick={() => updateStyle({ italic: !style.italic })}
                            className={`h-10 rounded-xl border flex items-center justify-center italic font-serif text-base transition-all cursor-pointer ${style.italic
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                          >
                            I
                          </button>

                          {/* Underline */}
                          <button
                            type="button"
                            onClick={() => updateStyle({ underline: !style.underline })}
                            className={`h-10 rounded-xl border flex items-center justify-center underline text-base transition-all cursor-pointer ${style.underline
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                          >
                            U
                          </button>

                          {/* Strikethrough */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStyle({ strikethrough: !style.strikethrough })
                            }
                            className={`h-10 rounded-xl border flex items-center justify-center line-through text-base transition-all cursor-pointer ${style.strikethrough
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                          >
                            S
                          </button>
                        </div>

                        {/* Row 2: Bullet list, Numbered list, Superscript, Subscript */}
                        <div className="grid grid-cols-4 gap-2">
                          {/* Bullet list */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStyle({
                                listStyle: style.listStyle === 'bullet' ? 'none' : 'bullet',
                              })
                            }
                            className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${style.listStyle === 'bullet'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            title="Lista de viñetas"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="8" y1="6" x2="21" y2="6"></line>
                              <line x1="8" y1="12" x2="21" y2="12"></line>
                              <line x1="8" y1="18" x2="21" y2="18"></line>
                              <line x1="3" y1="6" x2="3.01" y2="6"></line>
                              <line x1="3" y1="12" x2="3.01" y2="12"></line>
                              <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                          </button>

                          {/* Numbered list */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStyle({
                                listStyle: style.listStyle === 'number' ? 'none' : 'number',
                              })
                            }
                            className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${style.listStyle === 'number'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            title="Lista numerada"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
                            </svg>
                          </button>

                          {/* Superscript */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStyle({
                                script:
                                  style.script === 'superscript' ? 'none' : 'superscript',
                              })
                            }
                            className={`h-10 rounded-xl border flex items-center justify-center font-serif text-sm transition-all cursor-pointer ${style.script === 'superscript'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            title="Superíndice"
                          >
                            X²
                          </button>

                          {/* Subscript */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStyle({
                                script:
                                  style.script === 'subscript' ? 'none' : 'subscript',
                              })
                            }
                            className={`h-10 rounded-xl border flex items-center justify-center font-serif text-sm transition-all cursor-pointer ${style.script === 'subscript'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            title="Subíndice"
                          >
                            X₂
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 4. Alignment Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-400">
                          Alignment
                        </span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {/* Left */}
                        <button
                          type="button"
                          onClick={() => updateStyle({ align: 'left' })}
                          className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${currentAlign === 'left'
                              ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          title="Alinear a la izquierda"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="17" y1="10" x2="3" y2="10"></line>
                            <line x1="21" y1="6" x2="3" y2="6"></line>
                            <line x1="21" y1="14" x2="3" y2="14"></line>
                            <line x1="17" y1="18" x2="3" y2="18"></line>
                          </svg>
                        </button>

                        {/* Center */}
                        <button
                          type="button"
                          onClick={() => updateStyle({ align: 'center' })}
                          className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${currentAlign === 'center'
                              ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          title="Centrar"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="10" x2="6" y2="10"></line>
                            <line x1="21" y1="6" x2="3" y2="6"></line>
                            <line x1="21" y1="14" x2="3" y2="14"></line>
                            <line x1="18" y1="18" x2="6" y2="18"></line>
                          </svg>
                        </button>

                        {/* Right */}
                        <button
                          type="button"
                          onClick={() => updateStyle({ align: 'right' })}
                          className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${currentAlign === 'right'
                              ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          title="Alinear a la derecha"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="21" y1="10" x2="7" y2="10"></line>
                            <line x1="21" y1="6" x2="3" y2="6"></line>
                            <line x1="21" y1="14" x2="3" y2="14"></line>
                            <line x1="21" y1="18" x2="7" y2="18"></line>
                          </svg>
                        </button>

                        {/* Justify */}
                        <button
                          type="button"
                          onClick={() => updateStyle({ align: 'justify' })}
                          className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${currentAlign === 'justify'
                              ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 shadow-sm'
                              : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          title="Justificar"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="21" y1="6" x2="3" y2="6"></line>
                            <line x1="21" y1="10" x2="3" y2="10"></line>
                            <line x1="21" y1="14" x2="3" y2="14"></line>
                            <line x1="21" y1="18" x2="3" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* 5. Delete Element Button */}
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            rightSidebar.targetColIndex !== undefined &&
                            rightSidebar.targetBlockId
                          ) {
                            handleDeleteBlock(
                              rightSidebar.targetColIndex,
                              rightSidebar.targetBlockId
                            );
                          }
                        }}
                        className="w-full h-10 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/80 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <CaralIcon name="trash" size={15} />
                        <span>Eliminar elemento de texto</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4">
                <span className="text-xs text-neutral-400">
                  Usa los bloques arrastrables o edita directamente en el lienzo de la diapositiva.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(iconName) => {
          if (rightSidebar?.targetColIndex !== undefined && rightSidebar.targetBlockId) {
            handleUpdateBlockField(rightSidebar.targetColIndex, rightSidebar.targetBlockId, {
              icon: iconName,
            });
          }
          setIsIconPickerOpen(false);
        }}
      />

      {/* 6. Resource Selection Modal (Figma Screen 2 Selector) */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full p-6 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-xl font-bold font-poppins text-neutral-900 dark:text-neutral-100">
                  Seleccionar Recurso
                </h3>
                <p className="text-sm text-neutral-800 mt-0.5">
                  Elige una herramienta o componente interactivo de Crestone para incrustar en esta diapositiva.
                </p>
              </div>
              <button
                onClick={() => setIsResourceModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <CaralIcon name="closeSidebarLeft" size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 overflow-y-auto">
              {/* Option 1: Cover Generator */}
              <button
                onClick={() => handleSelectResource('cover')}
                className="flex flex-col p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50 dark:bg-neutral-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CaralIcon name="screenChart" size={20} />
                </div>
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                  Generador de Portadas
                </span>
                <span className="text-xs text-neutral-800 mt-1">
                  Portadas corporativas con títulos, variantes de logos y fondos Crestone.
                </span>
              </button>

              {/* Option 2: Connections Diagram */}
              <button
                onClick={() => handleSelectResource('connections')}
                className="flex flex-col p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50 dark:bg-neutral-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CaralIcon name="network" size={20} />
                </div>
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                  Diagrama de Conexiones
                </span>
                <span className="text-xs text-neutral-800 mt-1">
                  Mapeo interactivo de orígenes a destinos con tarjetas y temas.
                </span>
              </button>

              {/* Option 3: Deployment Options */}
              <button
                onClick={() => handleSelectResource('deployment')}
                className="flex flex-col p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50 dark:bg-neutral-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CaralIcon name="database" size={20} />
                </div>
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                  Opciones de Despliegue
                </span>
                <span className="text-xs text-neutral-800 mt-1">
                  Matriz comparativa de despliegues on-premise, cloud y SaaS.
                </span>
              </button>

              {/* Option 4: Deck Generator */}
              <button
                onClick={() => handleSelectResource('deck')}
                className="flex flex-col p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50 dark:bg-neutral-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CaralIcon name="grid" size={20} />
                </div>
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                  Generador de Decks
                </span>
                <span className="text-xs text-neutral-800 mt-1">
                  Presentación de diapositivas con presets y conectores integrados.
                </span>
              </button>

              {/* Option 5: Origins and Destinations List */}
              <button
                onClick={() => handleSelectResource('origins-destinations')}
                className="flex flex-col p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-blue-500 bg-neutral-50 dark:bg-neutral-950 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CaralIcon name="copy" size={20} />
                </div>
                <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600">
                  Listado de Orígenes y Destinos
                </span>
                <span className="text-xs text-neutral-800 mt-1">
                  Ecosistema de compatibilidad en formato listado 16:9 de 2 paneles.
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="ghost" onClick={() => setIsResourceModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
