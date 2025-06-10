
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss: AI Agency Platform | Build AI for Clients, No Code',
  description: "Start your AI agency with AutoBoss. Create AI chatbots and voice agents for businesses – no coding required. Clear tools for real client value. Join our free Early Adopter Program.",
  keywords: "AI agency platform, no-code AI, build AI for clients, AI chatbots, AI voice agents, start AI agency, AutoBoss",
  openGraph: {
    title: 'AutoBoss: AI Agency Platform - Build AI for Clients, No Code',
    description: "AutoBoss helps you start your AI agency. Create AI chatbots and voice agents for businesses without coding. Clear tools for real client value. Join our free Early Adopter Program.",
    type: 'website',
    // images: [{ url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-professional.png' }],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'AutoBoss: AI Agency Platform - Build AI for Clients, No Code',
  //   description: 'AutoBoss helps you start your AI agency. Create AI chatbots and voice agents for businesses without coding. Clear tools for real client value. Join our free Early Adopter Program.',
  //   images: ['https://YOUR_APP_DOMAIN.com/twitter-image-autoboss-professional.png'],
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
