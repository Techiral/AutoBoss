
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Twilio Voice Hook called for Agent ID: ${agentId}`);

  try {
    const requestBody = await request.text(); // Twilio often sends x-www-form-urlencoded
    console.log(`[${timestamp}] Request Body (raw):`, requestBody);
    
    // For x-www-form-urlencoded, you might parse it like this:
    // const parsedBody = new URLSearchParams(requestBody);
    // console.log(`[${timestamp}] Parsed Body:`, Object.fromEntries(parsedBody));

    // In a real implementation, you would:
    // 1. Verify the request is from Twilio (using request validation).
    // 2. Extract relevant information (e.g., CallSid, From number, SpeechResult if user spoke).
    // 3. Fetch agent configuration.
    // 4. Pass user input to your agent's conversational logic (e.g., executeAgentFlow or autonomousReasoning).
    // 5. Get the agent's text response.
    // 6. Construct TwiML to respond (e.g., <Say>the agent's text</Say>, <Gather> for next input).

    // Placeholder TwiML response
    const twiml = `
<Response>
  <Say voice="alice" language="en-US">
    Hello! This is the AutoBoss agent voice hook placeholder for agent ${agentId}. 
    Real integration with conversational logic is required here.
  </Say>
  <Hangup />
</Response>
    `.trim();

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });

  } catch (error: any) {
    console.error(`[${timestamp}] Error in Twilio Voice Hook for agent ${agentId}:`, error);
    const errorTwiml = `
<Response>
  <Say voice="alice" language="en-US">
    Sorry, an error occurred in the AutoBoss voice agent.
  </Say>
  <Hangup />
</Response>
    `.trim();
    return new NextResponse(errorTwiml, {
        status: 500, // Internal Server Error
        headers: { 'Content-Type': 'application/xml' },
    });
  }
}

// Optionally, handle GET requests if Twilio might ping it for status or initial setup
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  console.log(`Twilio Voice Hook (GET) called for Agent ID: ${agentId}. This endpoint primarily expects POST requests from Twilio.`);
  return NextResponse.json({ message: `AutoBoss Voice Hook for agent ${agentId} is active. Expecting POST requests from Twilio.` }, { status: 200 });
}

    