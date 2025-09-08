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
  onExportJSON,
  onImport,
  onResetToExample,
  onClearDiagram,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isModified,
  isExporting,
  isImporting,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <TooltipProvider>
      <header className="bg-background flex items-center justify-between border-b px-2">
        {/* Zone gauche - Titre */}
        <div className="flex min-w-0 items-center">
          <h1 className="truncate text-sm font-medium">
            Sequence 1
            {isModified && (
              <span className="text-muted-foreground ml-1">*</span>
            )}
          </h1>
          <EllipsisVertical
            size={16}
            className="text-muted-foreground ml-2 flex-shrink-0"
          />
        </div>

        {/* Zone droite - Actions */}
        <div className="ml-4 flex items-center gap-1">
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
                  className="hover:text-destructive h-8 w-8 p-0"
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
