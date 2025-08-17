'use client';

import { useEffect, useState } from 'react';
import { MCPIntegrationService } from '@/lib/mcp-integration';
import { useAuth } from '@/contexts/AuthContext';

export function MCPAutomation() {
  const [mcpServerUrl, setMcpServerUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mcpService = new MCPIntegrationService();
  const { currentUser, getUserCredentials } = useAuth();

  useEffect(() => {
    const fetchMcpUrl = async () => {
      if (currentUser) {
        const creds = await getUserCredentials();
        setMcpServerUrl(creds?.mcpServerUrl || null);
      }
    };

    fetchMcpUrl();
  }, [currentUser, getUserCredentials]);

  useEffect(() => {
    // Background connection monitoring
    const intervalId = setInterval(async () => {
      if (mcpServerUrl) {
        try {
          const connectionResult = await mcpService.testConnection(mcpServerUrl);
          setIsConnected(connectionResult);
          if (!connectionResult) {
            console.warn('MCP Connection Failed. Attempting to reconnect...');
          } 
        } catch (error) {
          console.error('Error testing MCP connection:', error);
          setIsConnected(false);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, [mcpServerUrl, mcpService]);

  useEffect(() => {
    // Automated Tool Execution (Example: Daily Lead Generation)
    const dailyLeadGeneration = async () => {
      if (isConnected && mcpServerUrl) {
        try {
          // Replace with the actual tool name and arguments
          const leadGenResult = await mcpService.callTool(mcpServerUrl, 'Automated Rainmaker', {
            prompt: "Generate leads for a marketing agency",
          });
          console.log('Lead Generation Result:', leadGenResult);
        } catch (error) {
          console.error('Error executing lead generation tool:', error);
        }
      }      
    };

    const now = new Date();
    const nextExecutionTime = new Date(now);
    nextExecutionTime.setDate(now.getDate() + 1); // Schedule for tomorrow
    nextExecutionTime.setHours(9, 0, 0, 0); // Set time to 9:00 AM

    const timeUntilNextExecution = nextExecutionTime.getTime() - now.getTime();

    const timeoutId = setTimeout(dailyLeadGeneration, timeUntilNextExecution);

    return () => clearTimeout(timeoutId);
  }, [isConnected, mcpServerUrl, mcpService]);

  return (
    <div>
      {isConnected ? (
        <p>Connected to MCP Server: {mcpServerUrl}</p>
      ) : (
        <p>Not connected to MCP Server. Please check your settings.</p>
      )}
    </div>
  );
}
