import { useEffect, useId, useRef } from 'react';

export function VisualMarkdownEditor({ value, onChange }: { value: string; onChange(value: string): void }) {
  const generatedId = useId().replaceAll(':', '');
  const elementId = `visual-editor-${generatedId}`;
  const editorRef = useRef<{ destroy(): void } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let disposed = false;
    void import('vditor').then(({ default: Vditor }) => {
      if (disposed) return;
      editorRef.current = new Vditor(elementId, {
        mode: 'wysiwyg', value, height: 'calc(100vh - 250px)', cache: { enable: false },
        toolbar: ['undo', 'redo', '|', 'headings', 'bold', 'italic', 'strike', 'link', '|', 'list', 'ordered-list', 'quote', 'code', 'inline-code', '|', 'table', 'upload', 'fullscreen'],
        input(markdown) { onChangeRef.current(markdown); },
      });
    });
    return () => {
      disposed = true;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [elementId]);

  return <div id={elementId} className="visual-editor" aria-label="可视化正文" />;
}
