/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // changed from tailwindcss
    autoprefixer: {},
  },
};

export default config;
