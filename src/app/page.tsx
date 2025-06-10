
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss: Start Your AI Agency FREE (No Code!) - Limited Spots!',
  description: "Heard of 'AI Automation Agencies'? AutoBoss is your easiest way to build & sell AI chatbots to businesses. Zero coding. Claim your FREE spot (first 100 users only) & start earning!",
  keywords: "start AI agency free, no-code AI agency, AI automation agency for beginners, sell AI chatbots, make money with AI, AutoBoss AI, AI business opportunity, client AI solutions",
  openGraph: {
    title: 'AutoBoss: Start Your AI Agency FREE (No Code!) - Limited Spots!',
    description: "Your shortcut to launching an AI Automation Agency. Build AI agents for clients, no tech skills needed. Limited free access for early adopters!",
    type: 'website',
    // images: [{ url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss.png' }], // Replace with your actual OG image URL
  },
  // twitter: { // Add if you have twitter specific cards
  //   card: 'summary_large_image',
  //   title: 'AutoBoss: AI Agency Platform - Free for First 100!',
  //   description: 'Want to start an AI Agency? AutoBoss makes it simple. No code. Real income. Limited free spots.',
  //   images: ['https://YOUR_APP_DOMAIN.com/twitter-image-autoboss.png'], // Replace
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
