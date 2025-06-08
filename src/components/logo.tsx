import Link from 'next/link';

// Custom AutoBoss SVG Logo (Botpress Inspired)
const AutoBossLogoIcon = ({ className }: { className?: string }) => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="AutoBoss Logo"
  >
    {/* Main 'B' like shape - using primary color for dark theme context */}
    <path 
      d="M25 20 H60 C75 20 75 30 75 35 V65 C75 70 75 80 60 80 H25 V20 Z 
         M25 50 H55 C65 50 65 50 65 50" 
      stroke="hsl(var(--primary))" 
      strokeWidth="10" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Green Accent Dot - using accent color */}
    <circle cx="75" cy="20" r="8" fill="hsl(var(--accent))" />
  </svg>
);


export function Logo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-foreground px-2 py-1 rounded-md hover:opacity-80 transition-opacity">
      <AutoBossLogoIcon className="h-8 w-8" />
      {!collapsed && <span className="font-headline text-2xl font-semibold">AutoBoss</span>}
    </Link>
  );
}
