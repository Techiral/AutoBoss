import { NextResponse } from 'next/server';

// Simple MCP server simulator for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'MCP Simulator Running',
    message: 'This is a test MCP server endpoint for development',
    endpoints: {
      '/api/mcp-simulator': 'GET - Server info',
      '/api/mcp-simulator/execute': 'POST - Execute MCP tools'
    }
  });
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Simulate MCP tool execution
    const tools = [
      'web_search',
      'file_read',
      'file_write',
      'http_request',
      'database_query'
    ];

    const simulatedResult = {
      prompt,
      tools_available: tools,
      execution_result: `Simulated MCP execution for: "${prompt}". Available tools: ${tools.join(', ')}. This is a test response from the MCP simulator.`,
      timestamp: new Date().toISOString(),
      server: 'MCP Simulator'
    };

    return NextResponse.json({ 
      result: simulatedResult.execution_result,
      details: simulatedResult
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 