<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language'
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'html',
    validator: (value) => ['html', 'css', 'javascript'].includes(value)
  },
  placeholder: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editorContainer = ref(null)
let editorView = null

const getLanguageExtension = () => {
  switch (props.language) {
    case 'html':
      return html()
    case 'css':
      return css()
    case 'javascript':
      return javascript()
    default:
      return html()
  }
}

// Custom JavaScript completions for common globals
const jsCompletions = (context) => {
  const word = context.matchBefore(/\w*/)
  if (!word || (word.from === word.to && !context.explicit)) return null

  const completions = [
    // Keywords
    { label: 'const', type: 'keyword' },
    { label: 'let', type: 'keyword' },
    { label: 'var', type: 'keyword' },
    { label: 'function', type: 'keyword' },
    { label: 'return', type: 'keyword' },
    { label: 'if', type: 'keyword' },
    { label: 'else', type: 'keyword' },
    { label: 'for', type: 'keyword' },
    { label: 'while', type: 'keyword' },
    { label: 'switch', type: 'keyword' },
    { label: 'case', type: 'keyword' },
    { label: 'break', type: 'keyword' },
    { label: 'continue', type: 'keyword' },
    { label: 'try', type: 'keyword' },
    { label: 'catch', type: 'keyword' },
    { label: 'finally', type: 'keyword' },
    { label: 'throw', type: 'keyword' },
    { label: 'class', type: 'keyword' },
    { label: 'extends', type: 'keyword' },
    { label: 'new', type: 'keyword' },
    { label: 'this', type: 'keyword' },
    { label: 'super', type: 'keyword' },
    { label: 'import', type: 'keyword' },
    { label: 'export', type: 'keyword' },
    { label: 'default', type: 'keyword' },
    { label: 'async', type: 'keyword' },
    { label: 'await', type: 'keyword' },
    { label: 'true', type: 'keyword' },
    { label: 'false', type: 'keyword' },
    { label: 'null', type: 'keyword' },
    { label: 'undefined', type: 'keyword' },
    // Globals
    { label: 'console', type: 'variable', detail: 'object' },
    { label: 'document', type: 'variable', detail: 'object' },
    { label: 'window', type: 'variable', detail: 'object' },
    { label: 'Array', type: 'class' },
    { label: 'Object', type: 'class' },
    { label: 'String', type: 'class' },
    { label: 'Number', type: 'class' },
    { label: 'Boolean', type: 'class' },
    { label: 'Promise', type: 'class' },
    { label: 'Map', type: 'class' },
    { label: 'Set', type: 'class' },
    { label: 'JSON', type: 'variable', detail: 'object' },
    { label: 'Math', type: 'variable', detail: 'object' },
    { label: 'Date', type: 'class' },
    // Common functions
    { label: 'setTimeout', type: 'function' },
    { label: 'setInterval', type: 'function' },
    { label: 'clearTimeout', type: 'function' },
    { label: 'clearInterval', type: 'function' },
    { label: 'fetch', type: 'function' },
    { label: 'addEventListener', type: 'function' },
    { label: 'querySelector', type: 'function' },
    { label: 'querySelectorAll', type: 'function' },
    { label: 'getElementById', type: 'function' },
    { label: 'getElementsByClassName', type: 'function' },
    { label: 'createElement', type: 'function' },
    { label: 'console.log', type: 'function', apply: 'console.log()' },
    { label: 'console.error', type: 'function', apply: 'console.error()' },
    { label: 'console.warn', type: 'function', apply: 'console.warn()' }
  ]

  return {
    from: word.from,
    options: completions.filter(c => c.label.toLowerCase().startsWith(word.text.toLowerCase()))
  }
}

const customTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12px',
    backgroundColor: '#171717'
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    overflow: 'auto'
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: '#22d3ee'
  },
  '.cm-cursor': {
    borderLeftColor: '#22d3ee'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#22d3ee20'
  },
  '.cm-gutters': {
    backgroundColor: '#171717',
    color: '#525252',
    border: 'none',
    borderRight: '1px solid #262626'
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#26262680'
  },
  '.cm-activeLine': {
    backgroundColor: '#26262640'
  },
  '.cm-foldGutter': {
    width: '12px'
  },
  // Autocomplete styles
  '.cm-tooltip': {
    backgroundColor: '#1e1e1e',
    border: '1px solid #3f3f3f',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
  },
  '.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: '12px',
      maxHeight: '200px'
    },
    '& > ul > li': {
      padding: '4px 8px',
      color: '#d4d4d4'
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: '#22d3ee30',
      color: '#22d3ee'
    }
  },
  '.cm-completionLabel': {
    color: '#d4d4d4'
  },
  '.cm-completionMatchedText': {
    color: '#22d3ee',
    fontWeight: 'bold',
    textDecoration: 'none'
  }
})

const createEditor = () => {
  if (editorView) {
    editorView.destroy()
  }

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString())
    }
  })

  const extensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    highlightActiveLine(),
    autocompletion({
      activateOnTyping: true,
      maxRenderedOptions: 15,
      override: props.language === 'javascript' ? [jsCompletions] : undefined
    }),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...completionKeymap
    ]),
    getLanguageExtension(),
    oneDark,
    customTheme,
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    updateListener,
    EditorView.lineWrapping
  ]

  const state = EditorState.create({
    doc: props.modelValue,
    extensions
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  })
}

watch(() => props.modelValue, (newValue) => {
  if (editorView && newValue !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newValue
      }
    })
  }
})

watch(() => props.language, () => {
  createEditor()
})

onMounted(() => {
  createEditor()
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
  }
})
</script>

<template>
  <div ref="editorContainer" class="h-full w-full overflow-hidden rounded-lg border border-neutral-800"></div>
</template>

<style>
.cm-editor {
  height: 100%;
}
.cm-scroller {
  overflow: auto;
}
</style>
