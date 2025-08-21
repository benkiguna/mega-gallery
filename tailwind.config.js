module.exports = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')], // Forms plugin for enhanced form styling
  darkMode: "class",
};
