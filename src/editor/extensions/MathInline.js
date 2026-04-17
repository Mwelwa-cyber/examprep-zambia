import { Node, mergeAttributes } from '@tiptap/core'
import katex from 'katex'

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-math-latex') ?? '',
        renderHTML: (attrs) => ({ 'data-math-latex': attrs.latex }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-math-latex]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'mnode',
        'data-math-latex': node.attrs.latex,
      }),
      node.attrs.latex,
    ]
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('span')
      dom.className = 'mnode'
      dom.contentEditable = 'false'

      const renderMath = (latex) => {
        dom.innerHTML = ''
        dom.setAttribute('data-math-latex', latex)
        try {
          katex.render(latex, dom, { throwOnError: false, displayMode: false })
        } catch {
          const code = document.createElement('code')
          code.textContent = latex
          dom.appendChild(code)
        }
      }

      renderMath(node.attrs.latex)

      dom.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!editor.isEditable) return
        dom.dispatchEvent(
          new CustomEvent('tiptap-math-click', {
            bubbles: true,
            cancelable: true,
            detail: {
              latex: node.attrs.latex,
              pos: typeof getPos === 'function' ? getPos() : null,
            },
          })
        )
      })

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== 'mathInline') return false
          if (updatedNode.attrs.latex !== node.attrs.latex) {
            renderMath(updatedNode.attrs.latex)
          }
          return true
        },
        destroy() {},
      }
    }
  },

  addCommands() {
    return {
      insertMathNode:
        (latex) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: 'mathInline', attrs: { latex } })
            .run(),
    }
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state } = this.editor
        const { selection } = state
        if (!selection.empty) return false
        const { $from } = selection
        const nodeBefore = $from.nodeBefore
        if (nodeBefore?.type?.name === 'mathInline') {
          return this.editor.chain()
            .command(({ tr }) => {
              tr.delete($from.pos - nodeBefore.nodeSize, $from.pos)
              return true
            })
            .run()
        }
        return false
      },
      Delete: () => {
        const { state } = this.editor
        const { selection } = state
        if (!selection.empty) return false
        const { $from } = selection
        const nodeAfter = $from.nodeAfter
        if (nodeAfter?.type?.name === 'mathInline') {
          return this.editor.chain()
            .command(({ tr }) => {
              tr.delete($from.pos, $from.pos + nodeAfter.nodeSize)
              return true
            })
            .run()
        }
        return false
      },
    }
  },
})
