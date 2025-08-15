import { NextResponse } from 'next/server';
import { MCPIntegrationService } from '@/lib/mcp-integration';

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const { serverUrl } = await request.json();
  
  if (!serverUrl) {
    return NextResponse.json({ 
      connected: false, 
      error: 'Server URL is required' 
    }, { status: 400 });
  }
  
  const mcpService = new MCPIntegrationService();
  
  try {
    const isConnected = await mcpService.testConnection(serverUrl);
    
    if (isConnected) {
      return NextResponse.json({ 
        connected: true,
        serverUrl,
        message: 'Successfully connected to MCP server'
      });
    } else {
      return NextResponse.json({ 
        connected: false, 
        error: 'Failed to establish connection to MCP server',
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
  } finally {
    // Clean up the connection
    await mcpService.disconnect();
  }
}
