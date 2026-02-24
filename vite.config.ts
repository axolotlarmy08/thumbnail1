import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  // ✅ add these
  server: {
    host: true,
    allowedHosts: 'all',
  },
  preview: {
    host: true,
    allowedHosts: 'all',
    port: Number(process.env.PORT) || 5050,
  },
});
