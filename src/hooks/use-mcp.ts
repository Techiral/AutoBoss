import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseMCPOptions {
  userId: string;
}

interface MCPConnection {
  isConnected: boolean;
  tools: any[];
  error: string | null;
}

export function useMCP({ userId }: UseMCPOptions) {
  const [connections, setConnections] = useState<Map<string, MCPConnection>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = useCallback(async (serverUrl: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mcp/${userId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl }),
      });
      
      const data = await response.json();
      return data.connected;
    } catch (error) {
      console.error('Error testing MCP connection:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const executeWithMCP = useCallback(async (prompt: string, serverUrl: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mcp/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, serverUrl }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.result;
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Failed to execute with MCP',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const getAvailableTools = useCallback(async (serverUrl: string) => {
    const isConnected = await testConnection(serverUrl);
    if (!isConnected) return [];
    
    // This would typically fetch tools from the MCP server
    return [];
  }, [testConnection]);

  return {
    testConnection,
    executeWithMCP,
    getAvailableTools,
    isLoading,
    connections,
  };
}
