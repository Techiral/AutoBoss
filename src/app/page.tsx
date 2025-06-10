
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss: Build Your AI Agency - No-Code Platform (Free Early Access)',
  description: "AutoBoss provides the tools to create, manage, and deploy AI agents for businesses, no coding required. Join our free early adopter program and start your AI agency today.",
  keywords: "AI agency platform, no-code AI, build AI chatbots, sell AI agents, AI for businesses, AutoBoss AI, accessible AI tools, start AI business",
  openGraph: {
    title: 'AutoBoss: Build Your AI Agency - No-Code Platform (Free Early Access)',
    description: "Empowering entrepreneurs to create and sell AI solutions. No coding needed. Limited free spots for early adopters.",
    type: 'website',
    // images: [{ url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-professional.png' }], // Replace with your actual OG image URL
  },
  // twitter: { // Add if you have twitter specific cards
  //   card: 'summary_large_image',
  //   title: 'AutoBoss: AI Agency Platform - Free Early Access',
  //   description: 'Launch your AI Agency. AutoBoss makes it simple. No code required. Limited free spots for early adopters.',
  //   images: ['https://YOUR_APP_DOMAIN.com/twitter-image-autoboss-professional.png'], // Replace
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}

