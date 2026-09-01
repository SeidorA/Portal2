import { MilkdownEditorWrapper } from '@/app/components/Editor/MilkdownEditor';

export default function TestEditorPage() {
  const initialMarkdown = `
# Prueba de Milkdown

Este es el editor Milkdown integrado en Portal2.

## Admonitions (Próximamente)

:::note (Nota Importante)
Este es un bloque que pronto será visual en el editor.
:::
  `;

  return (
    <div className="min-h-screen p-8 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Página de Prueba: Editor Milkdown</h1>
        <MilkdownEditorWrapper content={initialMarkdown} />
      </div>
    </div>
  );
}
