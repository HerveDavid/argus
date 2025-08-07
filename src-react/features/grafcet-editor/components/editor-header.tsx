import React from 'react';
import {
  EllipsisVertical,
  Undo2,
  Redo2,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Loader2,
} from 'lucide-react';

import { CardAction, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditorHeaderProps {
  onSave: () => void;
  onExportJSON: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToExample: () => void;
  onClearDiagram: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isModified: boolean;
  isSaving: boolean;
  isExporting: boolean;
  isImporting: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  onSave,
  onExportJSON,
  onImport,
  onResetToExample,
  onClearDiagram,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isModified,
  isSaving,
  isExporting,
  isImporting,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <TooltipProvider>
      <header className="flex items-center justify-between px-2 border-b bg-background">
        {/* Zone gauche - Titre */}
        <div className="flex items-center min-w-0">
          <h1 className="text-sm font-medium truncate">
            Sequence 1
            {isModified && (
              <span className="ml-1 text-muted-foreground">*</span>
            )}
          </h1>
          <EllipsisVertical
            size={16}
            className="ml-2 text-muted-foreground flex-shrink-0"
          />
        </div>

        {/* Zone droite - Actions */}
        <div className="flex items-center gap-1 ml-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-8 w-8 p-0"
                >
                  <Undo2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Annuler (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-8 w-8 p-0"
                >
                  <Redo2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rétablir (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Séparateur caché sur mobile */}
          <Separator orientation="vertical" className="hidden sm:block" />

          {/* Import/Export */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="h-8 w-8 p-0"
                >
                  {isImporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importer un fichier JSON</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExportJSON}
                  disabled={isExporting}
                  className="h-8 w-8 p-0"
                >
                  {isExporting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exporter en JSON</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Séparateur caché sur mobile */}
          <Separator orientation="vertical" className="hidden sm:block" />

          {/* Reset/Clear */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetToExample}
                  className="h-8 w-8 p-0"
                >
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Réinitialiser avec l'exemple</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearDiagram}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Effacer le diagramme</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onImport}
          className="hidden"
        />
      </header>
    </TooltipProvider>
  );
};
