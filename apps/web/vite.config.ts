import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget=process.env.KAEP_API_TARGET;

export default defineConfig({
  plugins: [react()],
  ...(apiTarget ? { server: { proxy: { '/api': { target: apiTarget, changeOrigin: true } } }, preview: { proxy: { '/api': { target: apiTarget, changeOrigin: true } } } } : {}),
});
