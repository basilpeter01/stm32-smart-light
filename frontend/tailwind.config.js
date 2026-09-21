/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080c14',
          panel: '#0d131f',
          card: '#101726',
          border: '#1b2537',
          borderLight: '#2a3a55',
          muted: '#64748b',
          text: '#e2e8f0',
          accent: '#10b981',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          red: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.35)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.45)',
      }
    },
  },
  plugins: [],
}
