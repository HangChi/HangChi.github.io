import { describe, expect, it } from 'vitest';

import { createEditorState, editorReducer, supportsVisualEditing } from './editor-model.js';

describe('editor model', () => {
  it('keeps Markdown canonical and marks local edits dirty', () => {
    const initial = createEditorState({ markdown: '# Hello', version: 3 });
    const edited = editorReducer(initial, { type: 'markdown-changed', markdown: '# Hello\n\nWorld' });

    expect(edited.markdown).toBe('# Hello\n\nWorld');
    expect(edited.dirty).toBe(true);
    expect(edited.version).toBe(3);
  });

  it('rejects visual mode for MDX and raw HTML', () => {
    expect(supportsVisualEditing('export const x = 1\n\n# Hi', 'mdx')).toEqual({ supported: false, reason: 'MDX' });
    expect(supportsVisualEditing('<section>Hi</section>', 'md')).toEqual({ supported: false, reason: 'HTML' });
  });

  it('accepts the server version after save and surfaces conflicts', () => {
    const state = editorReducer(createEditorState({ markdown: 'a', version: 1 }), {
      type: 'save-succeeded', version: 2,
    });
    expect(state.dirty).toBe(false);
    expect(state.version).toBe(2);

    const conflicted = editorReducer(state, { type: 'save-conflicted' });
    expect(conflicted.conflict).toBe(true);
  });
});
