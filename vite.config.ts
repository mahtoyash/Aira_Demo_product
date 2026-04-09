import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // PERFORMANCE: Pre-bundle TensorFlow.js so Vite doesn't have to transform
  // 263MB of files on-the-fly. This bundles it once into a single cached file.
  optimizeDeps: {
    include: ['@tensorflow/tfjs'],
  },
  worker: {
    format: 'es'
  }
})
