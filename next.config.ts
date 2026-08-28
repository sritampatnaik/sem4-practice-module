import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Computer-use / preview browsers often hit the dev server via another host.
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.local", "*"],
};

export default nextConfig;
