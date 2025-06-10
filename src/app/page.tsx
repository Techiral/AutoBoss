
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss: AI Agency Platform - Build No-Code AI Agents for Clients',
  description: "AutoBoss makes it simple to start and grow your AI agency. Create, train, and deploy AI chatbots and voice agents for businesses without coding. Join our free Early Adopter Program.",
  keywords: "AI agency platform, no-code AI, build AI chatbots, sell AI agents, AI for businesses, AutoBoss AI, accessible AI tools, start AI business, client management for AI",
  openGraph: {
    title: 'AutoBoss: AI Agency Platform - Build No-Code AI Agents for Clients',
    description: "Empowering entrepreneurs to create and sell AI solutions with ease. No coding needed. Explore our Early Adopter Program.",
    type: 'website',
    // images: [{ url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-professional.png' }], // Replace with your actual OG image URL
  },
  // twitter: { // Add if you have twitter specific cards
  //   card: 'summary_large_image',
  //   title: 'AutoBoss: AI Agency Platform - Build No-Code AI Agents',
  //   description: 'Launch your AI Agency with AutoBoss. No code required. Manage clients & deliver AI solutions.',
  //   images: ['https://YOUR_APP_DOMAIN.com/twitter-image-autoboss-professional.png'], // Replace
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
