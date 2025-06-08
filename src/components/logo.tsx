import Link from 'next/link';

// Custom AutoBoss SVG Logo
const AutoBossLogoIcon = ({ className }: { className?: string }) => (
  <svg 
    width="32" 
    height="32" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="AutoBoss Logo"
  >
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z" 
      fill="currentColor" 
      fillOpacity="0.3"
    />
    <path d="M8.5 7.5L12 12L8.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.5 7.5L12 12L15.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 14.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


export function Logo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-primary px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
      <AutoBossLogoIcon className="h-8 w-8" />
      {!collapsed && <span className="font-headline text-2xl font-semibold">AutoBoss</span>}
    </Link>
  );
}
