
import type { Metadata } from 'next';
import MarketingPageClient from './marketing-page-client';

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: 'AutoBoss | AI Teammates That Execute - Build Your AI Workforce',
  description: 'Stop building chatbots. Start deploying AI teammates. AutoBoss empowers you to create intelligent AI agents that understand, decide, and execute complex tasks. Try it free!',
};

export default function HomePage() {
  return <MarketingPageClient />;
}
