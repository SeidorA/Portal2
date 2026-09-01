import React, { useEffect, useRef, useState } from 'react';
import { useInstance } from '@milkdown/react';
import { usePluginViewContext } from '@prosemirror-adapter/react';
import { SlashProvider } from '@milkdown/plugin-slash';
import { setBlockType } from 'prosemirror-commands';

export const SlashMenu = () => {
  const [editor] = useInstance();
  const { view, prevState } = usePluginViewContext();
  const provider = useRef<SlashProvider | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    provider.current = new SlashProvider({
      content: containerRef.current,
    });
    
    provider.current.onShow = () => setShow(true);
    provider.current.onHide = () => setShow(false);

    
    return () => {
      provider.current?.destroy();
      provider.current = null;
    };
  }, []);

  useEffect(() => {
    if (!provider.current) return;
    provider.current.update(view, prevState);
  }, [view, prevState]);

  return (
    <div ref={containerRef} className="absolute z-50">
      <div className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg flex-col p-2 w-48 ${show ? 'flex' : 'hidden'}`}>
        <div className="text-xs font-semibold text-neutral-500 mb-2 px-2">Blocks</div>
        <button 
          className="text-left px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-sm flex items-center gap-2"
          onMouseDown={(e) => {
            e.preventDefault();
            provider.current?.hide();
            
            // Delete the slash
            const { state, dispatch } = view;
            if (state.selection.empty) {
              dispatch(state.tr.delete(state.selection.from - 1, state.selection.from));
            }
            
            // Execute the command in the next tick so the state is clean
            requestAnimationFrame(() => {
              const { state: nextState, dispatch: nextDispatch } = view;
              setBlockType(nextState.schema.nodes.heading, { level: 1 })(nextState, nextDispatch);
              view.focus();
            });
          }}
        >
          Heading
        </button>
        <button 
          className="text-left px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-sm flex items-center gap-2"
          onMouseDown={(e) => {
            e.preventDefault();
            provider.current?.hide();
            
            // Delete the slash
            const { state, dispatch } = view;
            if (state.selection.empty) {
              dispatch(state.tr.delete(state.selection.from - 1, state.selection.from));
            }
            
            // Execute the command
            requestAnimationFrame(() => {
              const { state: nextState, dispatch: nextDispatch } = view;
              setBlockType(nextState.schema.nodes.code_block)(nextState, nextDispatch);
              view.focus();
            });
          }}
        >
          Code Block
        </button>
      </div>
    </div>
  );
};
