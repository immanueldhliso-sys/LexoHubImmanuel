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
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
