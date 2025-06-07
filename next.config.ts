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
  devServer: {
    allowedDevOrigins: ['https://6000-firebase-studio-1749289894533.cluster-zkm2jrwbnbd4awuedc2alqxrpk.cloudworkstations.dev'],
  },
};

export default nextConfig;
