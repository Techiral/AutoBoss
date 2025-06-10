
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss: AI Agency Starter Kit - Build No-Code AI for Clients',
  description: "Launch your AI Automation Agency! AutoBoss is the world's first starter kit for non-technical founders to build, sell, and manage AI agents for clients. FREE Early Access.",
  keywords: "AI agency starter kit, no-code AI agency, AI automation agency platform, build AI for clients free, world's first AI agency kit, start AI agency for beginners, AI business for non-technical",
  openGraph: {
    title: 'AutoBoss: AI Agency Starter Kit - No-Code AI for Clients',
    description: "The easiest platform to start your AI agency. Build custom AI agents for businesses without coding. Join our free Early Adopter Program and shape the future of AI agencies.",
    type: 'website',
    // images: [{ url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-professional.png' }],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'AutoBoss: AI Agency Starter Kit - No-Code AI for Clients',
  //   description: 'The easiest platform to start your AI agency. Build custom AI agents for businesses without coding. Join our free Early Adopter Program.',
  //   images: ['https://YOUR_APP_DOMAIN.com/twitter-image-autoboss-professional.png'],
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
