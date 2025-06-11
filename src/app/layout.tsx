
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'AutoBoss: AI Agency Platform', // More general title for the whole app
  description: 'Build, manage, and deploy AI agents for your clients with AutoBoss. No-code AI solutions.',
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
          To replace the favicon:
          1. Place your new favicon file (e.g., my-favicon.ico or my-favicon.png) in the /public folder.
          2. Update the href below to point to your new file.
             For example, if your new file is named "my-favicon.png", change href="/site-icon.png" to href="/my-favicon.png".
             Ensure the 'type' attribute matches your file type (e.g., "image/x-icon" for .ico files).
        */}
        <link rel="icon" type="image/png" href="/my-new-favicon.png" />
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
