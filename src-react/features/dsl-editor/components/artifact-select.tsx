import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  Upload,
  RefreshCw,
  FileText,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import {
  useIidmArtifacts,
  IidmArtifact,
} from '../provider/dsl-editor.provider';

interface ArtifactSelectProps {
  onArtifactSelected?: (artifact: IidmArtifact) => void;
  onArtifactUploaded?: (uploadResponse: any) => void;
  className?: string;
}

export const ArtifactSelect: React.FC<ArtifactSelectProps> = ({
  onArtifactSelected,
  onArtifactUploaded,
  className = '',
}) => {
  const [artifacts, setArtifacts] = useState<IidmArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<IidmArtifact | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);

  const { setArtifact, getArtifacts, loadArtifact, isLoading, error } =
    useIidmArtifacts();

  // Charger les artefacts au montage du composant
  const loadArtifacts = useCallback(async () => {
    try {
      const artifactsList = await getArtifacts();
      setArtifacts(artifactsList);
    } catch (err) {
      console.error('Failed to load artifacts:', err);
      toast.error('Failed to load artifacts list');
    }
  }, [getArtifacts]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  // Gérer l'erreur du provider
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Sélectionner un artefact
  const handleArtifactSelect = useCallback(
    async (artifact: IidmArtifact) => {
      try {
        setSelectedArtifact(artifact);
        setIsOpen(false);

        // Charger les propriétés de l'artefact
        const artifactProperties = await loadArtifact(artifact.artifactId);

        toast.success(`${artifact.artifactId} loaded successfully`);

        // Notifier le parent
        onArtifactSelected?.(artifact);
      } catch (err) {
        console.error('Failed to load artifact:', err);
        toast.error(`Failed to load artifact: ${artifact.artifactId}`);
      }
    },
    [loadArtifact, onArtifactSelected],
  );

  // Uploader un nouvel artefact
  const handleUploadArtifact = useCallback(async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        title: 'Select IIDM file to upload',
        filters: [
          {
            name: 'IIDM files',
            extensions: ['xml', 'iidm'],
          },
          {
            name: 'All files',
            extensions: ['*'],
          },
        ],
      });

      if (selected) {
        const filePath = Array.isArray(selected) ? selected[0] : selected;
        const fileName =
          filePath.split('/').pop() ||
          filePath.split('\\').pop() ||
          'unknown.xml';

        // Lire le contenu du fichier
        const fileContent = await readFile(filePath);
        const fileContentArray = Array.from(new Uint8Array(fileContent));

        // Uploader l'artefact
        const uploadResponse = await setArtifact(fileContentArray, fileName);

        toast.success(`${fileName} uploaded successfully`);

        // Recharger la liste des artefacts
        await loadArtifacts();

        // Notifier le parent
        onArtifactUploaded?.(uploadResponse);

        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to upload artifact:', err);
      toast.error('Failed to upload the selected file');
    }
  }, [setArtifact, loadArtifacts, onArtifactUploaded]);

  // Rafraîchir la liste des artefacts
  const handleRefresh = useCallback(async () => {
    await loadArtifacts();
    toast.success('Artifacts list updated');
  }, [loadArtifacts]);

  // Formater la taille du fichier
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Formater la date
  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-between ${className}`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            <span className="truncate">
              {selectedArtifact
                ? selectedArtifact.artifactId.split('-')[0]
                : 'Select Artifact'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>IIDM Artifacts</DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem onClick={handleUploadArtifact} disabled={isLoading}>
          <Upload className="mr-2 h-4 w-4" />
          Upload New Artifact
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh List
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Liste des artefacts */}
        {isLoading ? (
          <DropdownMenuItem disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading artifacts...
          </DropdownMenuItem>
        ) : artifacts.length === 0 ? (
          <DropdownMenuItem disabled>
            <FileText className="mr-2 h-4 w-4" />
            No artifacts found
          </DropdownMenuItem>
        ) : (
          artifacts.map((artifact) => (
            <DropdownMenuSub key={artifact.artifactId}>
              <DropdownMenuSubTrigger>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span
                      className="max-w-[180px] truncate"
                      title={artifact.artifactId}
                    >
                      {artifact.artifactId}
                    </span>
                  </div>
                  {selectedArtifact?.artifactId === artifact.artifactId && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent>
                <DropdownMenuLabel className="text-xs">
                  Artifact Details
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => handleArtifactSelect(artifact)}
                  className="flex-col items-start gap-1"
                >
                  <div className="font-medium">Select This Artifact</div>
                  <div className="text-muted-foreground space-y-1 text-xs">
                    <div>ID: {artifact.artifactId}</div>
                    <div>Uploaded: {formatDate(artifact.uploadedAt)}</div>
                    <div>IIDM Path: {artifact.iidmPath}</div>
                    {artifact.description && (
                      <div>Description: {artifact.description}</div>
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
