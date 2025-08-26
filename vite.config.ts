import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

const getRepoName = () => {
  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    return `/${packageJson.name}/`
  } catch {
    return '/'
  }
}

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      // Disable ESLint in dev mode due to ESLint 9 incompatibility with vite-plugin-checker
      // ESLint still runs during build via npm run build
      overlay: {
        initialIsOpen: false,
        position: 'tl',
      },
    }),
  ],
  base: process.env.NODE_ENV === 'production' ? getRepoName() : '/',
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
