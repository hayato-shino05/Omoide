import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 追加の設定オプション */
  reactCompiler: true,
  allowedDevOrigins: ['localhost:3000', '192.168.1.7', '192.168.1.7:3000'],
};

export default nextConfig;
