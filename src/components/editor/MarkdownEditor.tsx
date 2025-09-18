import React, { useRef, useEffect, useCallback } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, highlightSpecialChars, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from '../../contexts/ThemeContext';
import { useContextMenu } from '../../hooks/useContextMenu';
import ContextMenu, { createEditorContextMenu } from '../common/ContextMenu';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  content: string;
  onContentChange?: (content: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  onContextMenu?: (e: MouseEvent, selectedText: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onContentChange,
  onSave,
  readOnly = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const { isDark } = useTheme();
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Helper functions for text manipulation (exactly like legacy)
  const insertText = useCallback((text: string) => {
    const view = viewRef.current;
    if (!view) return;
    
    const selection = view.state.selection.main;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length }
    });
    view.focus();
  }, []);

  const wrapText = useCallback((before: string, after: string = before) => {
    const view = viewRef.current;
    if (!view) return;
    
    const selection = view.state.selection.main;
    const selectedText = view.state.doc.sliceString(selection.from, selection.to);
    const newText = before + selectedText + after;
    
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: newText },
      selection: { 
        anchor: selection.from + before.length,
        head: selection.from + before.length + selectedText.length
      }
    });
    view.focus();
  }, []);

  const handleEditorAction = useCallback(async (action: string) => {
    switch (action) {
      case 'bold':
        wrapText('**');
        break;
      case 'italic':
        wrapText('*');
        break;
      case 'heading1':
        insertText('# ');
        break;
      case 'heading2':
        insertText('## ');
        break;
      case 'heading3':
        insertText('### ');
        break;
      case 'list':
        insertText('- ');
        break;
      case 'code':
        wrapText('`');
        break;
      case 'link':
        wrapText('[', '](url)');
        break;
      case 'table':
        insertText('\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [insertText, wrapText]);

  // Create editor state (exactly like legacy)
  const createEditorState = useCallback((initialContent: string) => {
    const extensions = [
      highlightSpecialChars(),
      history(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      highlightSelectionMatches(),
      
      // Markdown specific
      markdown(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      
      // Key bindings (exactly like legacy)
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...completionKeymap,
        {
          key: 'Ctrl-s',
          run: () => {
            onSave?.();
            return true;
          }
        }
      ]),
      
      // Theme compartment
      themeCompartment.current.of(isDark ? [oneDark] : []),
      
      // Content change listener
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          onContentChange?.(newContent);
        }
      }),
      
      // Read-only mode
      EditorState.readOnly.of(!!readOnly),
      
      // Line wrapping
      EditorView.lineWrapping,
      
      // Basic styling (exactly like legacy)
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
        },
        '.cm-content': {
          padding: '16px',
          fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
          lineHeight: '1.6',
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-editor': {
          height: '100%'
        },
        '.cm-scroller': {
          height: '100%'
        }
      })
    ];

    return EditorState.create({
      doc: initialContent,
      extensions
    });
  }, [isDark, onSave, onContentChange, readOnly]);

  // Initialize editor ONCE (like onMount in SolidJS)
  useEffect(() => {
    if (!editorRef.current) return;

    const state = createEditorState(content);
    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    // Cleanup function
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Empty dependencies - run only once!

  // Add context menu listener separately
  useEffect(() => {
    if (!editorRef.current || !viewRef.current) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const view = viewRef.current;
      if (!view) return;

      const selection = view.state.selection.main;
      const selectedText = view.state.doc.sliceString(selection.from, selection.to);
      const hasSelection = selection.from !== selection.to;

      const menuItems = createEditorContextMenu(hasSelection, selectedText, handleEditorAction);
      showContextMenu(e, menuItems);
    };

    editorRef.current.addEventListener('contextmenu', handleContextMenu);

    return () => {
      editorRef.current?.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [showContextMenu, handleEditorAction]); // Only context menu dependencies

  // Update content when props change (exactly like legacy)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    
    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content
        }
      });
    }
  }, [content]);

  // Update theme when dark mode changes (exactly like legacy)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    
    const themeExtension = isDark ? [oneDark] : [];
    view.dispatch({
      effects: themeCompartment.current.reconfigure(themeExtension)
    });
  }, [isDark]);

  return (
    <div className="markdown-editor">
      <div 
        ref={editorRef}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }}
      />
      <ContextMenu {...contextMenu} onClose={hideContextMenu} />
    </div>
  );
};

export default MarkdownEditor;
