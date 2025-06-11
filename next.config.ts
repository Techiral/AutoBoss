
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
        hostname: 'placehold.co',
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
            // Allow framing from self, any HTTP origin, and any HTTPS origin.
            // This explicitly lists schemes which might be required by some browsers/environments.
            value: "frame-ancestors 'self' http: https:;",
          },
          // If X-Frame-Options is also being set, ensure it's not DENY or SAMEORIGIN for chat.
          // CSP frame-ancestors should take precedence, but this is a fallback.
          // {
          //   key: 'X-Frame-Options',
          //   value: 'ALLOWALL', // Or a specific domain if not using '*' in CSP
          // }
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
  devServer: {
    allowedDevOrigins: ['https://6000-firebase-studio-1749289894533.cluster-zkm2jrwbnbd4awuedc2alqxrpk.cloudworkstations.dev'],
  },
};

export default nextConfig;
