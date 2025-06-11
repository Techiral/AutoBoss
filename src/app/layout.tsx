
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'AutoBoss: AI Agency Platform | Build AI for Clients, No Code',
  description: 'Build, manage, and deploy AI agents for your clients with AutoBoss. No-code AI solutions for your agency.',
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
          ACTION REQUIRED: Favicon Replacement
          1. Create your favicon files (e.g., favicon.ico, apple-touch-icon.png, etc.). A good tool for this is https://realfavicongenerator.net/
          2. Place these files in your /public folder.
          3. Update the href below AND uncomment/add other relevant icon links.
             For example, if your new file is named "favicon.png", change href="/my-new-favicon.png" to href="/favicon.png".
             Ensure the 'type' attribute matches your file type (e.g., "image/x-icon" for .ico files).
        */}
        <link rel="icon" type="image/png" href="/my-new-favicon.png" />
        {/* Example for other icons (uncomment and update paths):
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
