import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Storybook with Vite already wires up the React plugin.
  // Using it twice can cause React Refresh runtime conflicts.
  const isStorybook = Boolean(process.env.STORYBOOK);

  return {
    plugins: isStorybook ? [] : [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // Ensure a single React instance is used across the app and all dependencies
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
