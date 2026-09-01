'use client';

import 'prosemirror-view/style/prosemirror.css';

import React, { useState, useEffect } from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commandsCtx, editorViewCtx, prosePluginsCtx } from '@milkdown/core';
import { insert } from '@milkdown/utils';
import { Plugin, PluginKey, NodeSelection } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { insertImageCommand } from '@milkdown/preset-commonmark';
import { listenerCtx } from '@milkdown/plugin-listener';
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react';
import { Crepe } from '@milkdown/crepe';
import { createClient } from '@/utils/supabase/client';
import { MediaLibraryModal } from './MediaLibraryModal';
import { AdmonitionsMenu } from './AdmonitionsMenu';
import { WebinarEditorModal } from './WebinarEditorModal';
import IconPickerModal from '@/app/components/IconPickerModal';
import FeatureImportModal from './FeatureImportModal';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

interface MilkdownEditorProps {
  content: string;
  onChange?: (markdown: string) => void;
}

export const MilkdownEditor: React.FC<MilkdownEditorProps> = ({ content, onChange }) => {
  const supabase = createClient();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSplitGalleryOpen, setIsSplitGalleryOpen] = useState(false);
  const [isWebinarModalOpen, setIsWebinarModalOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isFeatureImportOpen, setIsFeatureImportOpen] = useState(false);
  const onChangeRef = React.useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const { get, loading } = useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: content,
      featureConfigs: {
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file: File) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `assets/docs/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('portal-assets')
              .upload(filePath, file);

            if (uploadError) {
              console.error('Error subiendo imagen:', uploadError);
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('portal-assets')
              .getPublicUrl(filePath);

            return publicUrl;
          },
        },
        [Crepe.Feature.Placeholder]: {
          text: 'Escribe / para ver los comandos',
        },
        [Crepe.Feature.BlockEdit]: {
          buildMenu: (builder: any) => {
            const group = builder.addGroup('alerts', 'Alertas');

            const addAdmonition = (type: string, label: string, icon: string) => {
              group.addItem(type, {
                label,
                icon,
                onRun: (ctx: any) => {
                  const text = `> [!${type.toUpperCase()}]\n> Título opcional\n> Escribe el contenido de tu alerta aquí...\n\n`;
                  insert(text)(ctx);
                }
              });
            };

            addAdmonition('note', 'Nota', '📝');
            addAdmonition('tip', 'Tip', '💡');
            addAdmonition('info', 'Info', 'ℹ️');
            addAdmonition('warning', 'Cuidado', '⚠️');
            addAdmonition('caution', 'Peligro', '🔥');
          }
        },
      },
    });

    const admonitionDecoratorPlugin = new Plugin({
      key: new PluginKey('admonition-decorator'),
      state: {
        init() { return DecorationSet.empty; },
        apply(tr, old, oldState, newState) {
          const decorations: Decoration[] = [];
          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'blockquote') {
              const firstText = node.textContent.trim();
              const match = firstText.match(/^\[!(NOTE|TIP|INFO|WARNING|CAUTION|DANGER)\]/i);
              if (match) {
                const type = match[1].toLowerCase();

                decorations.push(Decoration.node(pos, pos + node.nodeSize, {
                  class: `milkdown-admonition milkdown-admonition-${type}`,
                  'data-admonition-type': type
                }));

                let textPos = -1;
                node.descendants((child, childPos) => {
                  if (child.isText && textPos === -1 && child.text?.startsWith(`[!${match[1]}]`)) {
                    textPos = pos + 1 + childPos;
                  }
                });

                if (textPos !== -1) {
                  const tagLength = match[0].length;
                  decorations.push(Decoration.inline(textPos, textPos + tagLength, {
                    style: 'display: none;'
                  }));

                  const iconWidget = document.createElement('span');
                  const icons: any = { note: '📝', tip: '💡', info: 'ℹ️', warning: '⚠️', caution: '🔥', danger: '🔥' };
                  iconWidget.innerText = icons[type] || '💡';
                  iconWidget.style.marginRight = '8px';
                  decorations.push(Decoration.widget(textPos, iconWidget, { side: -1 }));
                }
              }
            }
          });
          return DecorationSet.create(newState.doc, decorations);
        }
      },
      props: {
        decorations(state) {
          return this.getState(state);
        }
      }
    });

    crepe.editor.config((ctx) => {
      ctx.get(listenerCtx)
        .mounted((ctx) => {
          // Additional mounted logic if needed
        })
        .markdownUpdated((ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown && onChangeRef.current) {
            onChangeRef.current(markdown);
          }
        });

      ctx.update(prosePluginsCtx, (plugins) => [...plugins, admonitionDecoratorPlugin]);
    });

    return crepe;
  }, []);

  const handleInsertImage = (url: string) => {
    if (loading) return;
    const editor = get();
    if (!editor) return;

    try {
      editor.action((ctx) => {
        const commandManager = ctx.get(commandsCtx);
        commandManager.call(insertImageCommand.key, {
          src: url,
          alt: 'Imagen de Galería',
        });
      });
    } catch (e) {
      console.error('Error insertando imagen:', e);
    }
  };

  const handleInsertSplit = (url: string, width?: string) => {
    if (loading) return;
    const editor = get();
    if (!editor) return;

    try {
      const widthParam = width ? `|${width}` : '|1/3';
      const text = `\n:::split(${url}${widthParam})\n### Título de la sección\nEscribe el contenido aquí...\n:::\n\n`;
      editor.action(insert(text));
    } catch (e) {
      console.error('Error insertando diseño dividido:', e);
    }
  };

  const handleInsertAdmonition = (type: string) => {
    if (loading) return;
    const editor = get();
    if (!editor) return;

    try {
      const text = `> [!${type}]\n> Título opcional\n> Escribe el contenido de tu alerta aquí...\n\n`;
      editor.action(insert(text));
    } catch (e) {
      console.error('Error insertando alerta:', e);
    }
  };

  const handleInsertConnections = () => {
    if (loading) return;
    const editor = get();
    if (!editor) return;
    try {
      editor.action(insert('\n<CrestoneConnections />\n'));
    } catch (e) {
      console.error('Error insertando connections:', e);
    }
  };

  const handleInsertWebinar = (markdownString: string) => {
    if (loading) return;
    const editor = get();
    if (!editor) return;
    try {
      editor.action(insert(`\n${markdownString}\n`));
    } catch (e) {
      console.error('Error insertando webinar:', e);
    }
  };

  const handleInsertIconTitle = (iconName: string, isBrand: boolean) => {
    if (loading) return;
    const editor = get();
    if (!editor) return;
    try {
      const tag = isBrand ? `!brand-${iconName}!` : `!icon-${iconName}!`;
      editor.action(insert(`\n# ${tag} Título Nuevo\n`));
    } catch (e) {
      console.error('Error insertando título con icono:', e);
    }
  };

  const handleInsertDynamicFeature = (productId: string, featureTitle: string, format: string) => {
    if (loading) return;
    const editor = get();
    if (!editor) return;
    try {
      editor.action(insert(`\n!PRODUCT_FEATURE:${productId}:${featureTitle}:${format}!\n`));
    } catch (e) {
      console.error('Error insertando feature dinámica:', e);
    }
  };

  const handleAlignImage = (align: 'left' | 'center' | 'right') => {
    if (loading) return;
    const editor = get();
    if (!editor) return;

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state, dispatch } = view;
      const { selection } = state;

      let imageNode: any = null;
      let imagePos = -1;

      if (selection instanceof NodeSelection && selection.node.type.name.includes('image')) {
        imageNode = selection.node;
        imagePos = selection.from;
      } else {
        const from = Math.max(0, selection.from - 10);
        const to = Math.min(state.doc.content.size, selection.to + 10);
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!imageNode && node.type.name.includes('image')) {
            imageNode = node;
            imagePos = pos;
            return false;
          }
        });
      }

      if (imageNode && imagePos !== -1) {
        const currentSrc = imageNode.attrs.src.split('#')[0];
        const newSrc = `${currentSrc}#align-${align}`;
        dispatch(state.tr.setNodeMarkup(imagePos, null, { ...imageNode.attrs, src: newSrc }));
      } else {
        alert('No se detectó ninguna imagen. Haz clic justo al lado o sobre la imagen e intenta de nuevo.');
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end gap-2 sticky top-0 z-10 bg-container py-2">
        <AdmonitionsMenu onInsert={handleInsertAdmonition} />
        <button
          type="button"
          onClick={handleInsertConnections}
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          🔗 Conexiones
        </button>
        <button
          type="button"
          onClick={() => setIsWebinarModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          🎥 Webinar
        </button>
        <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 self-center"></div>
        <button
          type="button"
          onClick={() => handleAlignImage('left')}
          className="flex items-center justify-center w-8 h-8 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
          title="Alinear Imagen a la Izquierda"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
        </button>
        <button
          type="button"
          onClick={() => handleAlignImage('center')}
          className="flex items-center justify-center w-8 h-8 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
          title="Centrar Imagen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="19" y1="12" x2="5" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
        </button>
        <button
          type="button"
          onClick={() => handleAlignImage('right')}
          className="flex items-center justify-center w-8 h-8 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
          title="Alinear Imagen a la Derecha"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="5" y2="18"></line></svg>
        </button>
        <div className="h-8 w-px bg-neutral-300 dark:bg-neutral-700 mx-1 self-center"></div>
        <button
          type="button"
          onClick={() => setIsGalleryOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          🖼️ Galería
        </button>
        <button
          type="button"
          onClick={() => setIsSplitGalleryOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
          title="Diseño Dividido (Imagen + Texto)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          Texto + Imagen
        </button>
        <button
          type="button"
          onClick={() => setIsIconPickerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          🏷️ Título Icono
        </button>
        <button
          type="button"
          onClick={() => setIsFeatureImportOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-md transition-colors"
        >
          ✨ Importar Feature
        </button>
      </div>
      <div className="py-8 overflow-x-auto w-full mb-12 bg-neutral-100 dark:bg-neutral-900 rounded-b-lg">
        <div
          className="milkdown-container relative bg-white dark:bg-neutral-950 p-6 pb-12 mx-auto w-[794px] min-h-[1123px] shadow-sm border border-neutral-200 dark:border-neutral-800"
          style={{ '--crepe-text-inline-size': '100%' } as React.CSSProperties}
        >
          <Milkdown />
        </div>
      </div>
      <MediaLibraryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleInsertImage}
      />
      <MediaLibraryModal
        isOpen={isSplitGalleryOpen}
        onClose={() => setIsSplitGalleryOpen(false)}
        onSelect={handleInsertSplit}
        showWidthSelector={true}
      />
      <WebinarEditorModal
        isOpen={isWebinarModalOpen}
        onClose={() => setIsWebinarModalOpen(false)}
        onInsert={handleInsertWebinar}
      />
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={handleInsertIconTitle}
      />
      <FeatureImportModal
        isOpen={isFeatureImportOpen}
        onClose={() => setIsFeatureImportOpen(false)}
        onInsert={handleInsertDynamicFeature}
      />
    </div>
  );
};

export const MilkdownEditorWrapper: React.FC<MilkdownEditorProps> = (props) => {
  return (
    <MilkdownProvider>
      <ProsemirrorAdapterProvider>
        <MilkdownEditor {...props} />
      </ProsemirrorAdapterProvider>
    </MilkdownProvider>
  );
};
