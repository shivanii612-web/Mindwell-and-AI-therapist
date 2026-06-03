import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@services': '/src/services',
      '@redux': '/src/redux',
      '@assets': '/src/assets',
      '@layouts': '/src/layouts',
      '@lib': '/src/lib',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
