import React, { useEffect, useRef } from 'react';
import { usePluginViewContext } from '@prosemirror-adapter/react';
import { BlockProvider } from '@milkdown/plugin-block';
import { Selection } from 'prosemirror-state';


import { useInstance } from '@milkdown/react';

export const BlockMenu = () => {
  const [editor] = useInstance();
  const { view, prevState } = usePluginViewContext();
  const provider = useRef<BlockProvider | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !editor || !editor.ctx) return;
    
    const p = new BlockProvider({
      ctx: editor.ctx,
      content: containerRef.current,
    });
    provider.current = p;
    
    // Immediately bind to the view if it exists
    if (view) {
      p.update(view, prevState);
    }
    
    return () => {
      p.destroy();
      provider.current = null;
    };
  }, [editor]);

  useEffect(() => {
    if (!provider.current) return;
    provider.current.update(view, prevState);
  }, [view, prevState]);

  return (
    <div ref={containerRef} data-show="false" className="absolute z-50 data-[show=false]:opacity-0 data-[show=false]:pointer-events-none transition-opacity duration-200 milkdown-block-handle">
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-sm">
        <button
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
          onClick={() => {
            // Because plugin-block triggers node selection on mousedown,
            // by the time onClick fires, the hovered block is already selected!
            const { state, dispatch } = view;
            const { selection } = state;
            const pos = selection.to;
            const tr = state.tr.insert(pos, state.schema.nodes.paragraph.createAndFill()!);
            const newSelection = Selection.near(tr.doc.resolve(pos), 1);
            dispatch(tr.setSelection(newSelection));
            view.focus();
            provider.current?.hide();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        <div 
          draggable
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
        </div>
      </div>
    </div>
  );
};
