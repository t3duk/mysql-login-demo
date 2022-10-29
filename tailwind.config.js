/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/*.pug"],
  theme: {
    extend: {},
  },
  plugins: [],
}

// npx tailwindcss -i ./src/style.css -o ./public/style.css --minify