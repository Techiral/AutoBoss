// Test script to verify Zapier MCP connection
const testZapierMCP = async () => {
  const zapierUrl = "https://mcp.zapier.com/api/mcp/s/MjUwMWQyNjktNWY1NC00MjU2LThjNTItYzlmYTg4YmFhZjdlOmZhM2QyNzMzLTdlMmItNDg0My05MDk3LTJkZGE4OWM5ZDc5Zg==/mcp";
  
  try {
    console.log("Testing Zapier MCP connection...");
    
    // Test basic connectivity
    const response = await fetch(zapierUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    
    if (response.ok) {
      console.log("✅ Connection successful!");
      
      // Try to get available tools
      const toolsResponse = await fetch(zapierUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: "tools/list",
          params: {}
        }),
      });
      
      if (toolsResponse.ok) {
        const tools = await toolsResponse.json();
        console.log("Available tools:", tools);
      } else {
        console.log("❌ Could not list tools:", toolsResponse.status);
      }
    } else {
      console.log("❌ Connection failed:", response.status);
    }
  } catch (error) {
    console.error("❌ Error testing MCP:", error);
  }
};

// Run the test
testZapierMCP(); 