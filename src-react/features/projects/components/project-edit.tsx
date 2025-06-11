import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { FileIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjectsStore } from '@/features/projects';

interface ProjectEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectEdit = ({ open, onOpenChange }: ProjectEditProps) => {
  const [projectName, setProjectName] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    currentProject,
    currentProjectPath,
    currentConfigPath,
    setCurrentProject,
    setCurrentConfigPath,
    addRecentProject,
  } = useProjectsStore();

  // Initialize form with current project data
  useEffect(() => {
    if (open) {
      setProjectName(currentProject || '');
      setConfigPath(currentConfigPath || '');
    }
  }, [open, currentProject, currentConfigPath]);

  const handleSelectConfigFile = async () => {
    try {
      const selectedPath = await openDialog({
        directory: false,
        multiple: false,
        filters: [
          {
            name: 'Config',
            extensions: ['toml'],
          },
        ],
      });

      if (selectedPath) {
        setConfigPath(selectedPath.toString());
      }
    } catch (err) {
      console.error('Error selecting config file:', err);
    }
  };

  const handleUpdateProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    setIsUpdating(true);

    try {
      // Update current project state
      setCurrentProject(projectName.trim());
      setCurrentConfigPath(configPath || '');

      // Update recent projects with the new data
      addRecentProject({
        name: projectName.trim(),
        path: currentProjectPath,
        configPath: configPath || '',
      });

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setProjectName(currentProject || '');
    setConfigPath(currentConfigPath || '');
    onOpenChange(false);
  };

  const isValid = projectName.trim().length > 0;
  const hasChanges =
    projectName.trim() !== (currentProject || '') ||
    configPath !== (currentConfigPath || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Modify the project name and update configuration and IIDM files.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Project Name */}
          <div className="grid gap-2">
            <Label htmlFor="edit-project-name">Project Name *</Label>
            <Input
              id="edit-project-name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Project Path (read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="project-path">Project Path</Label>
            <Input
              id="project-path"
              value={currentProjectPath || ''}
              readOnly
              className="bg-muted text-muted-foreground"
            />
          </div>

          {/* Config File */}
          <div className="grid gap-2">
            <Label htmlFor="edit-config-file">Configuration File (TOML)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-config-file"
                placeholder="No file selected"
                value={configPath ? configPath.split('/').pop() : ''}
                readOnly
                className="flex-1 bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectConfigFile}
                className="flex items-center gap-2"
              >
                <FileIcon className="size-4" />
                Browse
              </Button>
            </div>
            {configPath && (
              <p className="text-xs text-muted-foreground truncate">
                {configPath}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpdateProject}
            disabled={!isValid || !hasChanges || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
