import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ocean: '#071827',
        steel: '#18364a',
        sonar: '#17c3b2',
        gold: '#d6aa4c'
      }
    }
  },
  plugins: []
};
export default config;
