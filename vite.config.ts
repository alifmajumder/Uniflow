import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 1. Define global process to prevent "process is not defined" errors in browser
      'process.env': {}, 
      // 2. Explicitly inject the API Key. 
      // If env.API_KEY is undefined, this becomes undefined in the code.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});