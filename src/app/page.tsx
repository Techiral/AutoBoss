
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_DOMAIN),
  title: "Start Your AI Agency (No Code!) - World's #1 Starter Kit | AutoBoss",
  description: "Stop wondering 'How to start an AI automation agency?' AutoBoss is the simple, step-by-step starter kit for non-technical founders. Build AI for clients for FREE. Your 2025 AI agency dream starts here.",
  keywords: "how to start ai automation agency, ai agency starter kit, no-code ai agency, ai agency for beginners, start ai agency step-by-step, ai agency software, ai tools for agencies, build ai agents no code, ai business kit, start ai automation agency 2025, ai agency for non-technical, world's first ai agency kit, ai agency for free, non technical ai agency, AI agency India, AI agency US",
  openGraph: {
    title: "AutoBoss: Your AI Agency Dream, Simplified (No Code Needed!)",
    description: "Ready to start an AI automation agency but don't know how? AutoBoss is the world's FIRST starter kit. Get the tools, templates, and playbook. FREE access for early adopters!",
    type: 'website',
    url: '/', // Relative to metadataBase
    images: [
      {
        url: '/og-image-autoboss-starter-kit-v2.png', // Relative to metadataBase
        width: 1200,
        height: 630,
        alt: 'AutoBoss - AI Automation Agency Starter Kit: Build AI for Clients, No Code',
      },
    ],
    siteName: 'AutoBoss',
  },
  twitter: {
    card: 'summary_large_image',
    title: "AutoBoss: AI Agency Kit for Non-Techies - Start Free!",
    description: "Think starting an AI agency is too complex? Think again! AutoBoss is the free, no-code starter kit for 2025. Get your playbook & build client AI today.",
    images: ['/twitter-card-autoboss-starter-kit-v2.png'], // Relative to metadataBase
  },
};

export default function HomePage() {
  return <MarketingPageClient />;
}
