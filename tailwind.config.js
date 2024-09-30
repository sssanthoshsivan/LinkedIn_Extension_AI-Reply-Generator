module.exports = {
  content: [
    './entrypoints/**/*.{html,ts,tsx,vue}', // Scan HTML, React (TSX), and Vue components
    './components/**/*.{js,jsx,ts,tsx}',    // Include your shared components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
