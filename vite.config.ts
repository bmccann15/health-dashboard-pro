import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT for GitHub Pages project sites:
// If your repo is https://github.com/YOURNAME/health-dashboard-pro,
// the live URL will usually be https://YOURNAME.github.io/health-dashboard-pro/
// This base path keeps built JS/CSS from 404'ing on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: '/health-dashboard-pro/',
});
