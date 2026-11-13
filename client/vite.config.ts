import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@olympia/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Thư viện ít thay đổi tách riêng: trình duyệt giữ trong bộ nhớ đệm qua các lần cập nhật web
        manualChunks: {
          react: ['react', 'react-dom'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
      '/uploads': 'http://localhost:4000',
    },
  },
});
