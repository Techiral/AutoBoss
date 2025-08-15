import { MCPClient } from 'mcp-use';
import { config } from 'dotenv';

config();

export class AutoBossMCPClient {
  private client: MCPClient | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async connectToServer(serverUrl: string): Promise<MCPClient> {
    try {
      this.client = new MCPClient({
        mcpServers: {
          custom: {
            command: 'node',
            args: ['-e', `console.log('${serverUrl}')`],
            url: serverUrl,
            transport: 'sse'
          }
        }
      });
      
      await this.client.initialize();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  async getAvailableTools(client: MCPClient) {
    const tools = await client.listTools();
    return tools;
  }

  async executeTool(client: MCPClient, toolName: string, parameters: any) {
    const result = await client.callTool(toolName, parameters);
    return result;
  }

  async closeConnection() {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}
