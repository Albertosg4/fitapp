import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Este patrón (llamar función async desde useEffect) es válido y deliberado
      // en toda la app. La regla genera falsos positivos cuando setState está
      // dentro de funciones async llamadas desde efectos, no directamente en el cuerpo.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
