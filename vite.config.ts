import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// For a user site (<username>.github.io) the base is "/".
// For a project repo (github.com/<username>/<repo>) set BASE_PATH=/<repo>/
// The deploy workflow passes this in automatically.
const base = process.env.BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
