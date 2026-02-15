import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to avoid TS errors in the config file itself.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // 1. define 'process.env' as a stringified empty object.
      // This prevents "ReferenceError: process is not defined" if libraries try to access it.
      'process.env': JSON.stringify({}),
      
      // 2. Explicitly inject the API Key.
      // This string replacement happens at build time, converting 'process.env.API_KEY'
      // in your code directly to the string value of the key (e.g., "AIza...").
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});