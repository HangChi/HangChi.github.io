import type { SourceExtension } from './types.js';

export type EditorMode = 'source' | 'visual';

export type EditorState = {
  markdown: string;
  version: number;
  mode: EditorMode;
  dirty: boolean;
  conflict: boolean;
};

export function createEditorState(input: { markdown: string; version: number }): EditorState {
  return { ...input, mode: 'source', dirty: false, conflict: false };
}

export type EditorAction =
  | { type: 'markdown-changed'; markdown: string }
  | { type: 'mode-changed'; mode: EditorMode }
  | { type: 'save-succeeded'; version: number }
  | { type: 'save-conflicted' }
  | { type: 'server-loaded'; markdown: string; version: number };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'markdown-changed': return { ...state, markdown: action.markdown, dirty: true, conflict: false };
    case 'mode-changed': return { ...state, mode: action.mode };
    case 'save-succeeded': return { ...state, version: action.version, dirty: false, conflict: false };
    case 'save-conflicted': return { ...state, conflict: true };
    case 'server-loaded': return createEditorState(action);
  }
}

export function supportsVisualEditing(
  markdown: string,
  sourceExtension: SourceExtension,
): { supported: true } | { supported: false; reason: 'MDX' | 'HTML' } {
  if (sourceExtension === 'mdx' || /(^|\n)\s*(?:import|export)\s/m.test(markdown)) {
    return { supported: false, reason: 'MDX' };
  }
  if (/<[a-zA-Z][^>]*>/.test(markdown)) return { supported: false, reason: 'HTML' };
  return { supported: true };
}
