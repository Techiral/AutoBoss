
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

// Metadata for SEO - specific to this page
export const metadata: Metadata = {
  title: "AutoBoss: AI Agency Starter Kit - Build AI For Clients (No Code!)",
  description: "Start your AI Automation Agency today with AutoBoss! The #1 No-Code Starter Kit for non-technical founders to build & sell AI solutions. Your step-by-step guide to AI agency success in 2025. Get Free Early Access!",
  keywords: "how to start ai automation agency, no-code ai agency, ai agency starter kit, ai agency for beginners, non-technical ai agency, build ai for clients, ai agency software, ai tools for agencies, start ai automation agency 2025, ai business kit for free, world's first ai agency kit, ai agency india, ai agency us",
  openGraph: {
    title: "Launch Your AI Agency (No Code!) - AutoBoss: World's First Starter Kit",
    description: "Stop wondering 'How to start an AI automation agency?' AutoBoss is the simple, step-by-step starter kit. Build AI for clients FREE. Your AI agency dream starts now!",
    type: 'website',
    url: 'https://YOUR_APP_DOMAIN.com', // ACTION REQUIRED: Replace with your actual domain
    images: [
      {
        url: 'https://YOUR_APP_DOMAIN.com/og-image-autoboss-starter-kit-v2.png', // ACTION REQUIRED: Create and replace with your actual OG image URL
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
    description: "Think starting an AI agency is hard? AutoBoss is your no-code solution for 2025. Build AI for clients, get your playbook. Free access for a limited time!",
    // site: '@YourTwitterHandle', // Optional: Replace with your Twitter handle
    // creator: '@YourTwitterHandle', // Optional: Replace with your Twitter handle
    images: ['https://YOUR_APP_DOMAIN.com/twitter-card-autoboss-starter-kit-v2.png'], // ACTION REQUIRED: Create and replace with your actual Twitter card image URL
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
          Favicon Setup:
          You've placed 'favicon.png' in your /public folder.
          The link below is correctly set up for '/favicon.png'.
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
