import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' para poder publicar el build en cualquier subcarpeta (GitHub Pages, etc.)
export default defineConfig({
  base: './',
  plugins: [vue()],
})
