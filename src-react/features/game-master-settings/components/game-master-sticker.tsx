import { useState, useEffect } from 'react';
import { useGameMasterStore } from '../stores/game-master.store';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Server,
  Link,
  Save,
  Loader2,
  AlertCircle,
  Link2Off,
} from 'lucide-react';

export const GameMasterSticker = () => {
  const { url, isLoading, error, setUrl, clearError } = useGameMasterStore();
  const [editUrl, setEditUrl] = useState('');

  // Initialiser avec l'URL par défaut
  useEffect(() => {
    if (url) {
      setEditUrl(url);
    } else {
      setEditUrl('http://localhost:8000');
    }
  }, [url]);

  const handleSaveUrl = async () => {
    if (editUrl.trim()) {
      await setUrl(editUrl.trim());
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-amber-500';
    if (url && !error) return 'bg-green-500';
    if (error) return 'bg-destructive';
    return 'bg-muted';
  };

  const getStatusText = () => {
    if (isLoading) return 'Setting...';
    if (url && !error) return 'Connected';
    if (error) return 'Error';
    return 'Not configured';
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (url && !error) {
      return <Link className="h-4 w-4" />;
    }
    if (error) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Link2Off className="h-4 w-4" />;
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 text-xs font-light transition-colors">
          <span className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
          <span>GameMaster</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <h3 className="font-semibold">GameMaster Configuration</h3>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Current URL Display */}
          {url && (
            <div className="space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Current URL:</span>
                <span className="text-primary bg-muted rounded p-2 font-mono text-xs break-all">
                  {url}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border-destructive/20 flex items-start gap-2 rounded-md border p-3">
              <AlertCircle className="text-destructive mt-0.5 h-4 w-4" />
              <div className="flex-1">
                <p className="text-destructive text-sm">{error.message}</p>
                <button
                  onClick={clearError}
                  className="text-destructive/80 hover:text-destructive mt-1 text-xs underline"
                >
                  Clear error
                </button>
              </div>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-2">
            <label
              htmlFor="gamemaster-url"
              className="block text-sm font-medium"
            >
              Set GameMaster URL
            </label>
            <input
              id="gamemaster-url"
              type="text"
              placeholder="http://localhost:8000"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              disabled={isLoading}
              className="border-input bg-background focus:ring-ring focus:border-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && editUrl.trim()) {
                  handleSaveUrl();
                }
              }}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleSaveUrl}
            disabled={isLoading || !editUrl.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting URL...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Set URL
              </>
            )}
          </button>

          {/* Info text */}
          <p className="text-muted-foreground text-center text-xs">
            Enter the GameMaster server URL and click "Set URL" to configure the
            connection.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
