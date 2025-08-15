import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export class MCPIntegrationService {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private serverUrl: string | null = null;

  private async ensureConnected(serverUrl: string): Promise<void> {
    if (this.client && this.transport && this.serverUrl === serverUrl) return;
    
    await this.disconnect();
    this.serverUrl = serverUrl;
    this.transport = new StreamableHTTPClientTransport(new URL(serverUrl));
    this.client = new Client(
      { name: "autoboss-mcp-client", version: "1.0.0" },
      { capabilities: {} }
    );
    
    console.log("Connecting to MCP server:", serverUrl);
    await this.client.connect(this.transport);
    console.log("✅ Connected to MCP server");
  }

  async testConnection(serverUrl: string): Promise<boolean> {
    try {
      await this.ensureConnected(serverUrl);
      // Simple tool list as a sanity check
      await this.client!.listTools();
      console.log("✅ MCP connection test successful");
      return true;
    } catch (error) {
      console.error("❌ MCP connection test failed:", error);
      await this.disconnect();
      return false;
    }
  }

  async connectToServer(serverUrl: string): Promise<boolean> {
    try {
      return await this.testConnection(serverUrl);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      return false;
    }
  }

  async listTools(serverUrl: string): Promise<any> {
    try {
      await this.ensureConnected(serverUrl);
      console.log("Fetching available tools from MCP server...");
      const tools = await this.client!.listTools();
      console.log("Available MCP tools:", tools);
      return tools;
    } catch (error) {
      console.error("Failed to list MCP tools:", error);
      throw error;
    }
  }

  async callTool(serverUrl: string, name: string, args: Record<string, any>): Promise<any> {
    try {
      await this.ensureConnected(serverUrl);
      console.log(`Calling MCP tool: ${name} with args:`, args);
      const result = await this.client!.callTool({ name, arguments: args });
      console.log(`MCP tool ${name} result:`, result);
      return result;
    } catch (error) {
      console.error(`Failed to call MCP tool ${name}:`, error);
      throw error;
    }
  }

  // Back-compat shim used by existing chat route
  async executeWithMCP(prompt: string, serverUrl?: string): Promise<string> {
    if (!serverUrl) throw new Error("No MCP server URL provided");
    
    try {
      await this.ensureConnected(serverUrl);
      // Return tool list so the agent stops hallucinating
      const tools = await this.client!.listTools();
      return `MCP connected successfully! Available tools: ${JSON.stringify(tools, null, 2)}`;
    } catch (error) {
      console.error("MCP execution failed:", error);
      throw new Error(`MCP execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        console.log("Closing MCP client connection...");
        await this.client.close();
      }
      if (this.transport) {
        console.log("Closing MCP transport...");
        await this.transport.close();
      }
    } catch (error) {
      console.error("Error during MCP disconnect:", error);
    } finally {
      this.client = null;
      this.transport = null;
      this.serverUrl = null;
      console.log("MCP connection closed");
    }
  }

  isServerConnected(): boolean {
    return this.client !== null && this.transport !== null;
  }

  getServerUrl(): string | null {
    return this.serverUrl;
  }
} 