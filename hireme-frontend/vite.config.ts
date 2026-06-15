import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig(async () => {
  const reactPlugin = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [reactPlugin()],
    envDir: path.resolve(__dirname, 'config')
  }
})
