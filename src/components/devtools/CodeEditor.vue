<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from '@codemirror/language'
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

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      getLanguageExtension(),
      oneDark,
      customTheme,
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      updateListener,
      EditorView.lineWrapping
    ]
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
