
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: "Start Your AI Agency (No Code!) - World's #1 Starter Kit | AutoBoss",
  description: "Stop wondering 'How to start an AI automation agency?' AutoBoss is the simple, step-by-step starter kit for non-technical founders. Build AI for clients for FREE. Your 2025 AI agency dream starts here.",
  keywords: "how to start ai automation agency, ai agency starter kit, no-code ai agency, ai agency for beginners, start ai agency step-by-step, ai agency software, ai tools for agencies, build ai agents no code, ai business kit, start ai automation agency 2025, ai agency for non-technical, world's first ai agency kit, ai agency for free, non technical ai agency, AI agency India, AI agency US",
  openGraph: {
    title: "AutoBoss: Your AI Agency Dream, Simplified (No Code Needed!)",
    description: "Ready to start an AI automation agency but don't know how? AutoBoss is the world's FIRST starter kit. Get the tools, templates, and playbook. FREE access for early adopters!",
    type: 'website',
    url: 'https://YOUR_APP_DOMAIN.com', // Replace with your actual domain
    images: [
      {
        url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-starter-kit-v2.png', // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: 'AutoBoss - AI Automation Agency Starter Kit: Build AI for Clients, No Code',
      },
    ],
    siteName: 'AutoBoss',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Launch Your AI Agency (Even if You're Not a Techie!) - AutoBoss Starter Kit",
    description: "Think starting an AI agency is too complex? Think again! AutoBoss is the free, no-code starter kit for 2025. Get your playbook & build client AI today.",
    // site: '@YourTwitterHandle', // Optional: Replace with your Twitter handle
    // creator: '@YourTwitterHandle', // Optional: Replace with your Twitter handle
    images: ['https://YOUR_APP_DOMAIN.com/twitter-card-autoboss-starter-kit-v2.png'], // Replace with your actual Twitter card image URL
  },
};

export default function HomePage() {
  return <MarketingPageClient />;
}

