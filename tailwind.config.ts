import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial BT Delas (da camisa do torneio)
        laranja: {
          DEFAULT: "#FF6A1A",
          50: "#FFF4EC",
          100: "#FFE5D1",
          500: "#FF6A1A",
          600: "#E85A0E",
          700: "#C14807",
        },
        azul: {
          DEFAULT: "#2A2A9E",
          50: "#EEF0FF",
          500: "#2A2A9E",
          600: "#1E1E7A",
          700: "#161661",
        },
        pink: {
          DEFAULT: "#FF3D8B",
          500: "#FF3D8B",
        },
        amarelo: {
          DEFAULT: "#F7C948",
          500: "#F7C948",
        },
        creme: "#FFF8F1",
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "ui-sans-serif", "system-ui"],
        body: ["DM Sans", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
export default config;
