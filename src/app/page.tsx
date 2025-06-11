
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: "World's First AI Automation Agency Starter Kit | AutoBoss | No-Code",
  description: "Launch your AI automation agency in 2025, even with no technical skills! AutoBoss is the world's first starter kit. Step-by-step guide, free tools, and AI agent builder. Start for free today!",
  keywords: "AI automation agency starter kit, how to start AI automation agency, no-code AI agency, AI agency for beginners, start AI agency step-by-step, AI agency software, AI tools for agencies, build AI agents no code, AI business kit, start AI automation agency 2025, AI agency for non-technical, world's first AI agency kit, AI agency India, AI agency US, AI agency free",
  openGraph: {
    title: "AutoBoss: Your #1 AI Automation Agency Starter Kit (No-Code)",
    description: "Ready to start an AI automation agency? AutoBoss provides everything you need: no-code tools, templates, and a step-by-step playbook. Perfect for beginners and non-technical founders. Get started free!",
    type: 'website',
    url: 'https://YOUR_APP_DOMAIN.com', // Replace with your actual domain
    images: [
      {
        url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-starter-kit-v1.png', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'AutoBoss - AI Automation Agency Starter Kit',
      },
    ],
    siteName: 'AutoBoss',
  },
  twitter: {
    card: 'summary_large_image',
    title: "AutoBoss: Launch Your AI Agency (No Code!) - World's First Starter Kit",
    description: "Dreaming of an AI automation agency? AutoBoss makes it easy, even if you're not a tech expert. Get your free starter kit and playbook. Build AI for clients today!",
    // site: '@YourTwitterHandle', // Optional: Replace with your Twitter handle
    // creator: '@YourTwitterHandle', // Optional: Replace with your Twitter handle
    images: ['https://YOUR_APP_DOMAIN.com/twitter-card-autoboss-starter-kit-v1.png'], // Replace with your actual Twitter card image URL
  },
  // Optional: Add more specific metadata if needed
  // icons: {
  //   icon: '/favicon.ico', // Ensure this exists or use the one in layout.tsx
  //   apple: '/apple-touch-icon.png',
  // },
  // manifest: '/site.webmanifest',
};

export default function HomePage() {
  return <MarketingPageClient />;
}
