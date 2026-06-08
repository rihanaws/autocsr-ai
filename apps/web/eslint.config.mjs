import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    settings: {
      react: { version: "19" },
    },
    rules: {
      // False positive on Date.now() in async Server Components
      "react-hooks/purity": "off",
    },
  },
];
