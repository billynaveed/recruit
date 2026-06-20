import nextConfig from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: ["Psychology test/**", ".claude/**"] },
  ...nextConfig,
  ...nextTs,
];

export default eslintConfig;
