'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMCP } from '@/hooks/use-mcp';

export function MCPAutomation() {
  const [mcpServerUrl, setMcpServerUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentUser, getUserCredentials } = useAuth();
  const { testConnection, isLoading } = useMCP({ userId: currentUser?.uid || '' });

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
      if (mcpServerUrl && !isLoading) {
        try {
          const connectionResult = await testConnection(mcpServerUrl);
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
  }, [mcpServerUrl, testConnection, isLoading]);

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
