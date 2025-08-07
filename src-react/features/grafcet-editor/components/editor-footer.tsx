import React from 'react';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EditorFooterProps {
  onSave: () => void;
  onValidate: () => void;
  onPreview: () => void;
  onSettings: () => void;
  isModified: boolean;
  isSaving: boolean;
  isValidating?: boolean;
  validationStatus?: 'valid' | 'invalid' | 'warning' | null;
  validationMessage?: string;
  nodeCount?: number;
  linkCount?: number;
  selectedCount?: number;
}

export const EditorFooter: React.FC<EditorFooterProps> = ({
                                                            onSave,
                                                            onValidate,
                                                            onPreview,
                                                            onSettings,
                                                            isModified,
                                                            isSaving,
                                                            isValidating = false,
                                                            validationStatus = null,
                                                            validationMessage = '',
                                                            nodeCount = 0,
                                                            linkCount = 0,
                                                            selectedCount = 0,
                                                          }) => {
  const getValidationIcon = () => {
    if (isValidating) return <Loader2 size={14} className="animate-spin" />;

    switch (validationStatus) {
      case 'valid':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'invalid':
        return <AlertCircle size={14} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={14} className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getValidationText = () => {
    if (isValidating) return 'Validating...';
    if (validationMessage) return validationMessage;

    switch (validationStatus) {
      case 'valid':
        return 'Valid diagram';
      case 'invalid':
        return 'Errors detected';
      case 'warning':
        return 'Warnings';
      default:
        return 'Not validated';
    }
  };

  const getValidationTextColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'text-green-600';
      case 'invalid':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <footer className="w-full flex items-center justify-between px-2 border-t bg-background">
      {/* Left zone - Validation status */}
      <div className="flex items-center gap-2 min-w-0">
        {getValidationIcon()}
        <span className={`text-xs truncate ${getValidationTextColor()}`}>
          {getValidationText()}
        </span>
      </div>

      {/* Right zone - Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Secondary actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onValidate}
            disabled={isValidating}
            className="h-8 px-2 sm:px-3"
          >
            {isValidating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            <span className="ml-1 text-xs hidden sm:inline">Validate</span>
          </Button>
        </div>

        {/* Separator hidden on mobile */}
        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Primary action - Save */}
        <Button
          onClick={onSave}
          disabled={isSaving || !isModified}
          size="sm"
          className="h-6 px-3 sm:px-4"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span className="ml-2 text-xs">
            {isSaving ? 'Saving...' : 'Save'}
          </span>
          {isModified && (
            <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
              *
            </Badge>
          )}
        </Button>
      </div>
    </footer>
  );
};