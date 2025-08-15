import { NextResponse } from 'next/server';
import { MCPIntegrationService } from '@/lib/mcp-integration';

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const { serverUrl, prompt } = await request.json();
  
  if (!serverUrl) {
    return NextResponse.json({ error: 'Server URL is required' }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }
  
  const mcpService = new MCPIntegrationService();
  
  try {
    // First test the connection
    const isConnected = await mcpService.testConnection(serverUrl);
    
    if (!isConnected) {
      return NextResponse.json({ error: 'Failed to connect to MCP server' }, { status: 500 });
    }

    // Execute the prompt with MCP
    const result = await mcpService.executeWithMCP(prompt, serverUrl);
    
    return NextResponse.json({ 
      result,
      connected: true,
      serverUrl 
    });
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    return NextResponse.json({ 
      error: 'Failed to execute tool',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    // Clean up the connection
    await mcpService.disconnect();
  }
}
