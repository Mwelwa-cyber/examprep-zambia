import StarterKit      from '@tiptap/starter-kit'
import Underline       from '@tiptap/extension-underline'
import { TextStyle }   from '@tiptap/extension-text-style'
import { Color }       from '@tiptap/extension-color'
import TextAlign       from '@tiptap/extension-text-align'
import Highlight       from '@tiptap/extension-highlight'
import { Table }       from '@tiptap/extension-table'
import { TableRow }    from '@tiptap/extension-table-row'
import { TableCell }   from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Superscript     from '@tiptap/extension-superscript'
import Subscript       from '@tiptap/extension-subscript'
import { Placeholder } from '@tiptap/extension-placeholder'
import { MathInline }  from './MathInline.js'

export function buildExtensions({ placeholder = '', readOnly = false } = {}) {
  const base = [
    StarterKit.configure({
      heading:   { levels: [1, 2, 3] },
      codeBlock: false,
    }),
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({ multicolor: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Superscript,
    Subscript,
    MathInline,
  ]

  if (!readOnly) {
    base.push(
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      })
    )
  }

  return base
}

export const renderExtensions = buildExtensions({ readOnly: true })
