/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
      colors: { ink: "#172033", brand: "#6258E8", mint: "#DDF8EC" },
      boxShadow: { soft: "0 12px 40px rgba(27,39,78,.07)" },
    },
  },
  plugins: [require("daisyui")],
  daisyui: { themes: ["light"], logs: false },
};
