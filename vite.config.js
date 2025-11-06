import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Enable Brotli compression for production builds only
    ...(mode === 'production' ? [
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024, // Only compress files larger than 1KB
        deleteOriginFile: false // Keep original files
      }),
      // Image optimization plugin - production only
      imagetools({
        defaultDirectives: () => {
          // Optimize images to WebP format for modern browsers
          return new URLSearchParams({
            format: 'webp',
            quality: '80'
          })
        }
      })
    ] : [])
  ],
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      // Polyfills for Node.js modules
      process: 'process/browser',
      buffer: 'buffer',
    }
  },
  build: {
    // Rollup options for code splitting and optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // OpenAI SDK in separate chunk (~100KB)
          'openai': ['openai'],
          // React vendor libraries in separate chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Zod validation library
          'zod': ['zod']
        }
      }
    },
    // Set chunk size warning limit to 1000KB
    chunkSizeWarningLimit: 1000,
    // Disable sourcemaps in production for smaller builds
    sourcemap: false,
    // Use terser for minification with aggressive options
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log statements in production
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true
      }
    }
  }
}))
