
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

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
        url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-starter-kit-v2.png', // Replace with your actual OG image URL (e.g., /og-image.png if in public folder)
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
    images: ['https://YOUR_APP_DOMAIN.com/twitter-card-autoboss-starter-kit-v2.png'], // Replace with your actual Twitter card image URL (e.g., /twitter-card.png if in public folder)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
        {/*
          ACTION REQUIRED: Favicon Setup
          1. Create your favicon file (e.g., favicon.png). A good size is 32x32px or 64x64px.
          2. Place this file in your /public folder (e.g., /public/favicon.png).
          3. The link below is set up for favicon.png. If your file is named differently, update the href.
             For example, if your new file is named "my-brand-icon.png", change href="/favicon.png" to href="/my-brand-icon.png".
        */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        {/* For a more complete favicon setup including apple-touch-icon, etc.,
            consider using a generator like https://realfavicongenerator.net/
            and placing all generated files in your /public folder, then updating the links here.
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="manifest" href="/site.webmanifest">
        */}
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning={true}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
