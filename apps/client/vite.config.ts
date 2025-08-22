import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Foodie',
        short_name: 'Foodie',
        description: 'Foodie is a food calorie tracker',
        theme_color: '#000000',
        icons: [
          {
            src: '/logo.png',
            sizes: '256x256',
            type: 'image/png',
          },
        ],
      },
    }),
    tailwindcss(),
  ],
});
