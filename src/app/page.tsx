
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss: AI Agency Simple. No Code. Get Clients.',
  description: "Easiest way to start your AI Agency. Build AI for businesses. No coding. Get paid. Free access now.",
  keywords: "AI agency simple, no-code AI, start AI agency, build AI for clients, get paid with AI, AutoBoss free access",
  openGraph: {
    title: 'AutoBoss: AI Agency Simple. No Code. Get Clients.',
    description: "Easiest way to start your AI Agency. Build AI for businesses. No coding. Get paid. Free access now.",
    type: 'website',
    // images: [{ url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-professional.png' }],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'AutoBoss: AI Agency Simple. No Code. Get Clients.',
  //   description: 'Easiest way to start your AI Agency. Build AI for businesses. No coding. Get paid. Free access now.',
  //   images: ['https://YOUR_APP_DOMAIN.com/twitter-image-autoboss-professional.png'],
  // },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
