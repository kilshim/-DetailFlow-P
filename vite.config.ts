import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Safely replace process.env.API_KEY with the actual value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent "process is not defined" errors in browser
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
    }
  };
});