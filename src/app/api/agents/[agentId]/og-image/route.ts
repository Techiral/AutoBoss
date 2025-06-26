
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent } from '@/lib/types';
import { redirect } from 'next/navigation';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';
const DEFAULT_OG_IMAGE_PATH = '/default-og-image.png';

// This route specifically serves an image for social media crawlers.
// It fetches an agent's image Data URI from Firestore and serves it as a proper image file.
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  
  if (!agentId) {
    return redirect(`${APP_DOMAIN}${DEFAULT_OG_IMAGE_PATH}`);
  }

  try {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists() || !agentSnap.data()?.agentImageUrl) {
      // Agent not found or has no image, redirect to the default static image
      return redirect(`${APP_DOMAIN}${DEFAULT_OG_IMAGE_PATH}`);
    }

    const agent = agentSnap.data() as Agent;
    const dataUri = agent.agentImageUrl;

    // A Data URI looks like: "data:<mime-type>;base64,<data>"
    const match = dataUri?.match(/^data:(image\/[a-z]+);base64,(.*)$/);

    if (!match) {
      console.error(`Invalid Data URI format for agent ${agentId}`);
      return redirect(`${APP_DOMAIN}${DEFAULT_OG_IMAGE_PATH}`);
    }

    const mimeType = match[1]; // e.g., "image/jpeg"
    const base64Data = match[2];

    const imageBuffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error(`Error serving og:image for agent ${agentId}:`, error);
    // On any error, fall back to the default image
    return redirect(`${APP_DOMAIN}${DEFAULT_OG_IMAGE_PATH}`);
  }
}
