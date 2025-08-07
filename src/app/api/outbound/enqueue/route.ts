
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OutboundTaskPayloadSchema, type OutboundTaskPayload } from '@/lib/types'; // Assuming you'll define this in types.ts

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Received request for /api/outbound/enqueue`);

  let requestBody: OutboundTaskPayload;
  try {
    const rawJson = await request.json();
    requestBody = OutboundTaskPayloadSchema.parse(rawJson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[${timestamp}] Validation Error for enqueue request:`, error.errors);
      return NextResponse.json({ success: false, error: "Invalid request body for enqueue.", details: error.errors }, { status: 400 });
    }
    console.error(`[${timestamp}] Error parsing JSON for enqueue request:`, error);
    return NextResponse.json({ success: false, error: "Malformed JSON in request body for enqueue." }, { status: 400 });
  }

  const { type, to, agentId, payload, scheduledAt } = requestBody;

  try {
    const queueDocData: any = {
      type,
      to,
      agentId,
      payload,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (scheduledAt) {
      queueDocData.scheduledAt = new Date(scheduledAt); // Store as Firestore Timestamp if possible, or JS Date
    }

    const docRef = await adminDb.collection("outboundQueue").add(queueDocData);
    
    console.log(`[${timestamp}] Successfully enqueued task of type '${type}' for '${to}'. Document ID: ${docRef.id}`);
    return NextResponse.json({ 
      success: true, 
      message: `Task of type '${type}' for '${to}' enqueued successfully.`,
      taskId: docRef.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error(`[${timestamp}] Error adding task to outboundQueue in Firestore:`, error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to enqueue task.", 
      details: error.message 
    }, { status: 500 });
  }
}
