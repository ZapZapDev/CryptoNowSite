import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [tailwindcss()],
    root: 'src',
    optimizeDeps: {
        include: [
            '@solana/pay',
            '@solana/web3.js',
            '@solana/wallet-adapter-base',
            'buffer'
        ]
    },
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            buffer: 'buffer'
        }
    },
    build: {
        target: 'esnext',
        rollupOptions: {
            external: [],
            output: {
                manualChunks: {
                    'solana': ['@solana/web3.js', '@solana/pay'],
                    'wallet': ['@solana/wallet-adapter-base']
                }
            }
        }
    },
    server: {
        fs: {
            strict: false
        }
    }
});