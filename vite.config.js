import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    // Escucha en toda la red local (0.0.0.0) para probar desde otros dispositivos.
    host: true,
    // La API de Laravel (php artisan serve); así el navegador usa el mismo origen y no hace falta CORS.
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
