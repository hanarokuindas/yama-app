import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 本番ビルド（GitHub Pages）では /yama-app/ をベースにする
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/yama-app/' : '/',
  plugins: [react()],
}))
