import type { NextConfig } from "next";

// Le site est servi sous https://<compte>.github.io/<depot>/ : le workflow de
// déploiement renseigne NEXT_PUBLIC_BASE_PATH avec le nom du dépôt.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
