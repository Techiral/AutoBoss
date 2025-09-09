import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { serverUrl } = await request.json();

  if (!serverUrl) {
    return NextResponse.json({
      connected: false,
      error: 'Server URL is required'
    }, { status: 400 });
  }

  try {
    // Use AbortController to prevent the request from hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

    const response = await fetch(serverUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      // The connection is likely valid if we get a 2xx response
      // We don't need to consume the stream here, just check if it's connectable
      return NextResponse.json({
        connected: true,
        serverUrl,
        message: 'Successfully connected to MCP server'
      });
    } else {
      return NextResponse.json({
        connected: false,
        error: `Failed to establish connection to MCP server. Status: ${response.status}`,
        serverUrl
      });
    }
  } catch (error) {
    console.error('Error testing MCP connection:', error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      serverUrl
    });
  }
}
