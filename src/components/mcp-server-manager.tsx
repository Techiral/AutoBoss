'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface MCPServer {
  id: string;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
}

export function MCPServerManager({ userId }: { userId: string }) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const testConnection = async (url: string) => {
    setIsTesting(true);
    try {
      const response = await fetch(`/api/mcp/${userId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: url }),
      });
      
      const data = await response.json();
      
      if (data.connected) {
        toast({
          title: 'Connection successful',
          description: 'MCP server is reachable and responding.',
        });
        return true;
      } else {
        toast({
          title: 'Connection failed',
          description: data.error || 'Unable to connect to MCP server.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Connection error',
        description: 'Failed to test connection. Please check the URL.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const addServer = async () => {
    if (!newServerUrl || !newServerName) {
      toast({
        title: 'Missing information',
        description: 'Please provide both server name and URL.',
        variant: 'destructive',
      });
      return;
    }

    const isValid = await testConnection(newServerUrl);
    if (!isValid) return;

    setIsAdding(true);
    try {
      const newServer: MCPServer = {
        id: Date.now().toString(),
        name: newServerName,
        url: newServerUrl,
        isActive: true,
      };

      // Here you would typically save to Firestore
      setServers([...servers, newServer]);
      
      toast({
        title: 'Server added',
        description: 'MCP server has been successfully added.',
      });

      setNewServerUrl('');
      setNewServerName('');
    } catch (error) {
      toast({
        title: 'Error adding server',
        description: 'Failed to add MCP server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeServer = (id: string) => {
    setServers(servers.filter(server => server.id !== id));
    toast({
      title: 'Server removed',
      description: 'MCP server has been removed.',
    });
  };

  const toggleServer = (id: string) => {
    setServers(servers.map(server => 
      server.id === id ? { ...server, isActive: !server.isActive } : server
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>MCP Server Management</CardTitle>
          <CardDescription>
            Connect your agents to external tools via MCP servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Server Name"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
              />
              <Input
                placeholder="https://your-mcp-server.com/sse"
                value={newServerUrl}
                onChange={(e) => setNewServerUrl(e.target.value)}
              />
            </div>
            <Button 
              onClick={addServer} 
              disabled={isTesting || isAdding}
              className="w-full md:w-auto"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add MCP Server'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {servers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servers.map(server => (
                <div key={server.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{server.name}</h4>
                    <p className="text-sm text-muted-foreground">{server.url}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {server.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleServer(server.id)}
                    >
                      {server.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServer(server.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
