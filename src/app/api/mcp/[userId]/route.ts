import { NextResponse } from 'next/server';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export async function POST(request: Request) {
  const { serverUrl, prompt } = await request.json();

  if (!serverUrl) {
    return NextResponse.json({ error: 'Server URL is required' }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  let client: Client | null = null;
  let transport: StreamableHTTPClientTransport | null = null;

  try {
    client = new Client(
      { name: "autoboss-backend-client", version: "1.0.0" },
      { capabilities: {} }
    );
    transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    await client.connect(transport);

    // For this simplified example, we'll just send the prompt as-is.
    // A more advanced implementation would involve a reasoning loop.
    const result = await client.request(prompt);

    return NextResponse.json({
      result,
      connected: true,
      serverUrl
    });
  } catch (error) {
    console.error('Error executing MCP request:', error);
    return NextResponse.json({
      error: 'Failed to execute request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    if (transport) await transport.close();
    if (client) await client.close();
  }
}
