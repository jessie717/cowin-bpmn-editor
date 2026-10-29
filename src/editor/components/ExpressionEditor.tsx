import { autocompletion, snippetCompletion } from '@codemirror/autocomplete'
import { linter } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType } from 'vue'
import {
  EXPRESSION_FUNCTIONS,
  type ExpressionSymbol,
  validateExpression
} from '../expression'

export type ExpressionInsert = (value: string) => void

export const ExpressionEditor = defineComponent({
  name: 'ExpressionEditor',
  props: {
    modelValue: { type: String, default: '' },
    symbols: {
      type: Array as PropType<ExpressionSymbol[]>,
      default: () => []
    },
    expectedType: { type: String, default: '' },
    onChange: {
      type: Function as PropType<(value: string) => void>,
      default: undefined
    },
    onReady: {
      type: Function as PropType<(insert: ExpressionInsert) => void>,
      default: undefined
    }
  },
  setup(props) {
    const host = ref<HTMLElement>()
    let view: EditorView | undefined
    const symbols = computed(() => props.symbols)

    onMounted(() => {
      const completion = autocompletion({
        activateOnTyping: true,
        override: [
          (context) => {
            const token = context.matchBefore(/[^\s(),]*/)
            if (!token || (!context.explicit && token.from === token.to)) return null
            return {
              from: token.from,
              options: [
                ...EXPRESSION_FUNCTIONS.map((definition) =>
                  snippetCompletion(
                    `${definition.name}(${definition.parameters
                      .map((parameter, index) => `\${${index + 1}:${parameter.name}}`)
                      .join(', ')})`,
                    {
                      label: definition.name,
                      type: 'function',
                      detail: `(${definition.parameters.map((p) => `${p.name}: ${p.types.join('|')}${p.required ? '' : '?'}`).join(', ')}) → ${definition.returnType}`
                    }
                  )
                ),
                ...symbols.value.map((symbol) => ({
                  label: symbol.id,
                  displayLabel: symbol.label,
                  detail: `${symbol.type}${symbol.detail ? ` · ${symbol.detail}` : ''}`,
                  type: symbol.id.startsWith('global.constant') ? 'constant' : 'variable'
                }))
              ]
            }
          }
        ]
      })
      const diagnostics = linter(
        (editor) => {
          const source = editor.state.doc.toString()
          if (!source.trim()) return []

          return validateExpression(
            source,
            symbols.value,
            props.expectedType
          ).diagnostics.map((diagnostic) => ({
            ...diagnostic,
            from: Math.min(diagnostic.from, editor.state.doc.length),
            to: Math.min(Math.max(diagnostic.from, diagnostic.to), editor.state.doc.length)
          }))
        },
        { delay: 300 }
      )
      view = new EditorView({
        parent: host.value,
        state: EditorState.create({
          doc: props.modelValue,
          extensions: [
            keymap.of([]),
            lineNumbers(),
            EditorView.lineWrapping,
            completion,
            diagnostics,
            EditorView.updateListener.of((update) => {
              if (update.docChanged) props.onChange?.(update.state.doc.toString())
            }),
            EditorView.theme({
              '&': { height: '216px', fontSize: '14px' },
              '.cm-content': { minHeight: '200px', padding: '8px 11px' },
              '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto' },
              '&.cm-focused': { outline: 'none' }
            })
          ]
        })
      })
      props.onReady?.((value) => {
        if (!view) return
        const { from, to } = view.state.selection.main
        view.dispatch({ changes: { from, to, insert: value }, selection: { anchor: from + value.length } })
        view.focus()
      })
    })

    watch(
      () => props.modelValue,
      (value) => {
        if (!view || value === view.state.doc.toString()) return
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
      }
    )

    onBeforeUnmount(() => view?.destroy())
    return () => <div ref={host} class="cowin-expression-editor" />
  }
})
