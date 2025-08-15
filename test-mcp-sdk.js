// Test script to verify MCP SDK integration with Zapier
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const testZapierMCP = async () => {
  const zapierUrl = "https://mcp.zapier.com/api/mcp/s/MjUwMWQyNjktNWY1NC00MjU2LThjNTItYzlmYTg4YmFhZjdlOmZhM2QyNzMzLTdlMmItNDg0My05MDk3LTJkZGE4OWM5ZDc5Zg==/mcp";
  
  try {
    console.log("🧪 Testing MCP SDK integration with Zapier...");
    
    // Initialize the client
    const client = new Client(
      { name: "autoboss-test-client", version: "1.0.0" },
      { capabilities: {} }
    );
    
    // Create transport
    const transport = new StreamableHTTPClientTransport(new URL(zapierUrl));
    
    // Connect to the server
    console.log("🔌 Connecting to Zapier MCP server...");
    await client.connect(transport);
    console.log("✅ Connected to Zapier MCP server");
    
    // List available tools
    console.log("📋 Fetching available tools...");
    const tools = await client.listTools();
    console.log("🛠️ Available tools:", JSON.stringify(tools, null, 2));
    
    // Test finding a document (if tools are available)
    if (tools && tools.length > 0) {
      const findDocTool = tools.find(t => t.name === "google_docs_find_a_document");
      if (findDocTool) {
        console.log("🔍 Testing google_docs_find_a_document tool...");
        try {
          const result = await client.callTool({
            name: "google_docs_find_a_document",
            arguments: {
              title: "test-document"
            }
          });
          console.log("📄 Tool result:", JSON.stringify(result, null, 2));
        } catch (toolError) {
          console.log("⚠️ Tool execution failed (expected for test):", toolError.message);
        }
      }
    }
    
    // Close the connection
    await transport.close();
    await client.close();
    console.log("🔌 Connection closed");
    
  } catch (error) {
    console.error("❌ Error testing MCP SDK:", error);
  }
};

// Run the test
testZapierMCP(); 