
import type { Metadata, ResolvingMetadata } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent } from "@/lib/types";
import ChatClientPage from './chat-client-page'; // Import the new client component

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

// Helper to convert Firestore Timestamps in agent data
const convertTimestampsToISOForChat = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.sharedAt && newAgent.sharedAt.toDate) { 
    newAgent.sharedAt = newAgent.sharedAt.toDate().toISOString();
  }
  if (newAgent.knowledgeItems) {
    newAgent.knowledgeItems = newAgent.knowledgeItems.map((item: any) => {
      if (item.uploadedAt && item.uploadedAt.toDate) {
        return { ...item, uploadedAt: item.uploadedAt.toDate().toISOString() };
      }
      return item;
    });
  }
  return newAgent as Agent;
};

// This type is for the props that generateMetadata will receive
type Props = {
  params: { agentId: string }
}

// Function to generate metadata dynamically (Server Component context)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const agentId = params.agentId;
  const defaultOgImage = `${APP_DOMAIN}/default-og-image.png`; // Ensure this path is correct

  if (!agentId) {
    return {
      title: "Chat Agent",
      description: "Chat with an AI agent.",
      openGraph: {
        images: [{ url: defaultOgImage, width: 1200, height: 630, alt: "AI Chat Agent" }],
      }
    };
  }

  try {
    const agentRef = doc(db, 'agents', agentId as string);
    const agentSnap = await getDoc(agentRef);

    if (agentSnap.exists()) {
      const agent = convertTimestampsToISOForChat({ id: agentSnap.id, ...agentSnap.data() });
      const title = agent.generatedName || agent.name || "AI Chat Agent";
      const description = agent.ogDescription || agent.description || `Chat with ${title}.`;
      
      // Use the agentImageUrl (which may be a Data URI) if available, otherwise fallback to default.
      const imageUrl = agent.agentImageUrl || defaultOgImage; 

      return {
        title: `${title} - Powered by AutoBoss`,
        description: description,
        openGraph: {
          title: title,
          description: description,
          url: `${APP_DOMAIN}/chat/${agentId}`,
          images: [{ url: imageUrl, width: 1200, height: 630, alt: title }], 
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: title,
          description: description,
          images: [imageUrl],
        },
      };
    }
  } catch (error) {
    console.error("Error fetching agent data for metadata:", error);
  }
  
  const defaultTitle = "AI Chat Agent - Powered by AutoBoss";
  const defaultDescription = "Engage in a conversation with an intelligent AI agent.";
  
  return {
    title: defaultTitle,
    description: defaultDescription,
     openGraph: {
      title: defaultTitle,
      description: defaultDescription,
      url: `${APP_DOMAIN}/chat/${agentId}`,
      images: [{ url: defaultOgImage, width: 1200, height: 630, alt: "AI Chat Agent" }],
      type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: defaultTitle,
        description: defaultDescription,
        images: [defaultOgImage],
    }
  };
}

// This is the main page component (Server Component)
export default function PublicChatPageContainer({ params }: Props) {
  // The client component will handle fetching and displaying the chat interface
  return <ChatClientPage agentId={params.agentId} />;
}
