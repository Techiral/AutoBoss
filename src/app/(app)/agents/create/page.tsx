
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';


// This page is now deprecated. The new agent creation flow starts from the homepage.
// We are redirecting users to the homepage to use the new conversational builder.
export default function DeprecatedCreateAgentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Redirecting...</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center p-10'>
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className='ml-2 text-muted-foreground'>Moving to the new agent builder...</p>
        </CardContent>
    </Card>
  );
}
