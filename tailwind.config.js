/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutros — cinza quente (texto e estrutura)
        ink: {
          900: "#2A2422", // texto primário
          700: "#4A4340",
          500: "#6E6763", // texto secundário
          400: "#9A938D", // muted / eixos
        },
        // Marca — marsala (autoridade, elegância)
        brand: {
          900: "#3A1D20", // sidebar profundo
          800: "#512A2C",
          700: "#8A4A4D", // botões / destaque
          600: "#A15F61",
          100: "#F3E7E7", // wash claro
        },
        // Acento — dourado (usado com parcimônia)
        gold: {
          DEFAULT: "#B08A3C",
          600: "#977530",
          soft: "#EDE2C6",
        },
        paper: {
          DEFAULT: "#F6F4F1", // plano de fundo da página (branco quente)
          card: "#FFFFFF",
          surface: "#FCFBF9", // superfície de gráfico
        },
        line: "#E7E2DB", // hairline
        // Dados — derivados da marca (sempre com rótulo junto)
        data: {
          assinatura: "#8A4A4D", // marsala
          reembolso: "#B08A3C", // dourado
          compra: "#7D756C", // cinza
        },
        // Status (sinais funcionais, discretos — nunca viram série)
        status: {
          ok: "#2F7D4F",
          warn: "#C08A2C",
          alert: "#C0392B",
        },
      },
      fontFamily: {
        serif: ['"Newsreader"', "Georgia", "serif"],
        sans: ['"Public Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(19,33,27,0.04), 0 1px 3px rgba(19,33,27,0.06)",
        pop: "0 8px 30px rgba(19,33,27,0.12)",
      },
    },
  },
  plugins: [],
};
