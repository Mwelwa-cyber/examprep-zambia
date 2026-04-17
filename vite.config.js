import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('pdfjs-dist')) return 'pdfjs'
          if (id.includes('/react') || id.includes('\\react')) return 'react-vendor'
          if (id.includes('/firebase') || id.includes('\\firebase')) return 'firebase-vendor'
          // Let Vite auto-split @tiptap and katex — they are dynamically imported
          if (id.includes('@tiptap') || id.includes('/katex') || id.includes('\\katex') || id.includes('/prosemirror') || id.includes('\\prosemirror')) return undefined
          return 'vendor'
        },
      },
    },
  },
})
