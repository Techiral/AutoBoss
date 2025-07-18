
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
        // Apply these headers to all /chat/* routes
        source: '/chat/:agentId*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allow framing from self, any HTTP origin, and any HTTPS origin using host wildcards.
            value: "frame-ancestors 'self' http://* https://*;",
          },
          // It's generally recommended NOT to use X-Frame-Options if CSP frame-ancestors is used.
          // CSP should be sufficient for modern browsers.
        ],
      },
      // Example: You might want a more restrictive default CSP for other parts of your app
      // This is commented out as it's not directly related to the fix, but shows how you'd do it.
      // {
      //   source: '/((?!api/|chat/).*)', // Matches all pages except /api/* and /chat/*
      //   headers: [
      //     {
      //       key: 'Content-Security-Policy',
      //       // A more restrictive policy for the main app pages
      //       value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://placehold.co https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'; connect-src 'self' https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com;",
      //     }
      //   ]
      // }
    ];
  },
  // devServer option removed as it's not standard for production builds
};

export default nextConfig;
