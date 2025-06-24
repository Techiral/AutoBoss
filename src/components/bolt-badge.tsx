
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BoltBadge() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check session storage for dismissal state first
    if (sessionStorage.getItem('bolt-badge-dismissed') === 'true') {
      setIsDismissed(true);
    }
    
    // Check for theme on mount and setup observer for theme changes
    const observer = new MutationObserver(() => {
        setIsDarkTheme(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Set initial theme
    setIsDarkTheme(document.documentElement.classList.contains('dark'));
    
    setIsMounted(true);

    return () => observer.disconnect();
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    try {
        sessionStorage.setItem('bolt-badge-dismissed', 'true');
    } catch (error) {
        console.error("Could not save badge dismissal state to session storage:", error);
    }
  };

  if (!isMounted || isDismissed) {
    return null;
  }

  const badgeSrc = isDarkTheme 
    ? "https://placehold.co/80x80/FFFFFF/0D0D0D.png?text=B" // White circle for dark bg
    : "https://placehold.co/80x80/0D0D0D/FFFFFF.png?text=B"; // Black circle for light bg

  const badgeAlt = isDarkTheme ? "Bolt.new badge white" : "Bolt.new badge black";

  return (
    // Hidden on mobile (sm breakpoint), visible on md and up
    <div className="hidden md:block fixed bottom-5 right-5 z-50 group">
      <Link href="https://bolt.new/" target="_blank" rel="noopener noreferrer" aria-label="Visit Bolt.new">
        <Image
          src={badgeSrc}
          alt={badgeAlt}
          width={80}
          height={80}
          className="rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110"
        />
      </Link>
      <button
        onClick={handleDismiss}
        className="absolute -top-1 -right-1 bg-card border border-border text-foreground rounded-full p-0.5 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive hover:text-destructive-foreground"
        aria-label="Dismiss Bolt.new badge"
      >
        <X size={14} />
      </button>
    </div>
  );
}
