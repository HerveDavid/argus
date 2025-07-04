import { useState, useEffect } from 'react';
import { useNatsStore } from '../stores/nats.store';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Server,
  Wifi,
  WifiOff,
  Settings,
  Play,
  Square,
  Loader2,
  AlertCircle,
  CheckCircle,
  Cable,
} from 'lucide-react';

export const NatsSticker = () => {
  const {
    status,
    address,
    isConnecting,
    isDisconnecting,
    isSettingAddress,
    isLoadingStatus,
    error,
    connect,
    disconnect,
    setAddress,
    getStatus,
    connectToSavedAddress,
    getSavedAddress,
    clearError,
  } = useNatsStore();

  const [editAddress, setEditAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSavedAddress, setIsLoadingSavedAddress] = useState(false);

  // Récupérer l'adresse sauvegardée au démarrage
  useEffect(() => {
    const loadSavedAddress = async () => {
      setIsLoadingSavedAddress(true);
      try {
        const savedAddress = await getSavedAddress();
        if (savedAddress) {
          setEditAddress(savedAddress);
          // Optionnel : définir aussi l'adresse dans le store si elle n'est pas déjà définie
          if (!address) {
            await setAddress(savedAddress);
          }
        }
      } catch (error) {
        console.error('Failed to load saved address:', error);
      } finally {
        setIsLoadingSavedAddress(false);
      }
    };

    loadSavedAddress();
  }, [getSavedAddress, setAddress, address]);

  // Synchroniser avec l'adresse actuelle du store
  useEffect(() => {
    if (address && address !== editAddress) {
      setEditAddress(address);
    }
  }, [address]);

  const handleSaveAddress = async () => {
    if (editAddress.trim()) {
      await setAddress(editAddress.trim());
      setIsEditing(false);
    }
  };

  const handleConnect = async () => {
    if (address) {
      await connect();
    } else if (editAddress.trim()) {
      await setAddress(editAddress.trim());
      await connect();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleConnectToSaved = async () => {
    await connectToSavedAddress();
  };

  const getStatusColor = () => {
    if (status?.connected) return 'bg-green-500';
    if (isConnecting || isDisconnecting) return 'bg-amber-500';
    if (error) return 'bg-destructive';
    return 'bg-muted';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isDisconnecting) return 'Disconnecting...';
    if (status?.connected) return 'Connected';
    if (error) return 'Error';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (
      isConnecting ||
      isDisconnecting ||
      isLoadingStatus ||
      isLoadingSavedAddress
    ) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (status?.connected) {
      return <Wifi className="h-4 w-4" />;
    }
    if (error) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer text-xs font-light text-muted-foreground hover:text-foreground transition-colors">
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span>Nats</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <h3 className="font-semibold">Nats</h3>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Status Info */}
          {status && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="text-primary">
                    {status.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {status.address && (
                  <div className="flex justify-between">
                    <span className="font-medium">Address:</span>
                    <span className="text-primary font-mono text-xs">
                      {status.address}
                    </span>
                  </div>
                )}
                {status.connected && (
                  <div className="flex justify-between">
                    <span className="font-medium">Channels:</span>
                    <span className="text-primary">
                      {status.active_channels}
                    </span>
                  </div>
                )}
              </div>
              {status.connected &&
                status.channel_names &&
                status.channel_names.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Active Channels:</div>
                    <div className="flex flex-wrap gap-1">
                      {status.channel_names
                        .slice(0, 3)
                        .map((channel, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-sm text-xs border"
                          >
                            {channel}
                          </span>
                        ))}
                      {status.channel_names.length > 3 && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded-sm text-xs border">
                          +{status.channel_names.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error.message}</p>
                <button
                  onClick={clearError}
                  className="mt-1 text-xs text-destructive/80 hover:text-destructive"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Address Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="nats-address"
                className="block text-sm font-medium"
              >
                Nats Address
              </label>
              {isLoadingSavedAddress && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              <input
                id="nats-address"
                type="text"
                placeholder="nats://localhost:4222"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                disabled={isSettingAddress || isLoadingSavedAddress}
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50"
              />
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={isSettingAddress || isLoadingSavedAddress}
                className="px-3 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            {isEditing && (
              <button
                onClick={handleSaveAddress}
                disabled={
                  isSettingAddress ||
                  !editAddress.trim() ||
                  isLoadingSavedAddress
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSettingAddress ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Save Address
                  </>
                )}
              </button>
            )}
          </div>

          <hr className="border-border" />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {status?.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={
                  isConnecting || !editAddress.trim() || isLoadingSavedAddress
                }
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Connect
              </button>
            )}

            <button
              onClick={handleConnectToSaved}
              disabled={isConnecting || !address || isLoadingSavedAddress}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cable className="h-4 w-4" />
              )}
              Saved
            </button>
          </div>

          {/* Utility Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={getStatus}
              disabled={isLoadingStatus}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {isLoadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Check Status
            </button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
