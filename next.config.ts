
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      },
      {
        // Apply these headers to all /chat/* routes
        source: '/chat/:agentId*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow framing from self, any HTTP origin, and any HTTPS origin using host wildcards.
            value: "frame-ancestors 'self' http://* https://*;",
          },
        ],
      },
      {
        source: '/((?!api/|chat/).*)', // Matches all pages except /api/* and /chat/*
        headers: [
          {
            key: 'Content-Security-Policy',
            // A more permissive policy for the main app pages to allow all secure connections
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://placehold.co https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'; connect-src 'self' https://*;",
          }
        ]
      }
    ];
  },
};

export default nextConfig;
