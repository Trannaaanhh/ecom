import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080';
  const appRole = mode === 'staff' ? 'staff' : mode === 'portal' ? 'portal' : 'customer';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_APP_ROLE': JSON.stringify(appRole),
    },
    server: {
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
