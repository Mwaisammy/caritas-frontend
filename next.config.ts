import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This rewrite keeps the backend address server-side and gives browser calls
  // a same-origin URL. Without it, the browser would need backend CORS access.
  rewrites() {
    const gatewayURL = process.env.CARITAS_BACKEND_URL ?? "http://localhost:8080";

    return [
      {
        source: "/api/backend/:path*",
        destination: `${gatewayURL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
