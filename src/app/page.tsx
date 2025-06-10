
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss | No-Code AI Agency Platform - Build & Sell AI Agents',
  description: 'Launch your AI agency with AutoBoss. Create, train, and deploy custom AI chatbots and voice agents for businesses. Manage clients, deliver value, and grow your revenue—no coding required.',
  keywords: "AI agency platform, no-code AI, build AI chatbots, sell AI agents, client management AI, AI for business, custom AI solutions, chatbot builder, voice agent platform",
  openGraph: {
    title: 'AutoBoss | No-Code AI Agency Platform - Build & Sell AI Agents',
    description: 'Empower your agency to deliver powerful AI solutions. Create custom chatbots and voice agents for clients with AutoBoss.',
    type: 'website',
    // images: [{ url: '/og-image.png' }], // Replace with your actual OG image URL
  },
  // twitter: { // Add if you have twitter specific cards
  //   card: 'summary_large_image',
  //   title: 'AutoBoss | No-Code AI Agency Platform - Build & Sell AI Agents',
  //   description: 'Build custom AI agents for your clients effortlessly with AutoBoss. No coding needed.',
  //   images: ['/twitter-image.png'], // Replace
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
