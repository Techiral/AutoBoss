import { BotMessageSquare } from 'lucide-react';
import Link from 'next/link';

export function Logo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-primary px-2 py-1 rounded-md hover:bg-primary/10 transition-colors">
      <BotMessageSquare className="h-8 w-8" />
      {!collapsed && <span className="font-headline text-2xl font-semibold">AutoBoss</span>}
    </Link>
  );
}
