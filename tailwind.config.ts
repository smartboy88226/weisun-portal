import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        appbg: "#F6F8FB",
        brand: {
          50: "#EAF1FF",
          600: "#2F6FED",
          700: "#2458C6",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(16,24,40,.06)",
      },
    },
  },
  plugins: [],
};
export default config;
