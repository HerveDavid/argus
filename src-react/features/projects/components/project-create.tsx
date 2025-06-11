import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { FileIcon } from 'lucide-react';
import { useState } from 'react';

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

interface ProjectCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectCreate = ({ open, onOpenChange }: ProjectCreateProps) => {
  const [projectName, setProjectName] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const {
    setCurrentProject,
    setCurrentProjectPath,
    setCurrentConfigPath,
    addRecentProject,
  } = useProjectsStore();

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

        // Auto-fill project name if empty
        if (!projectName) {
          const fileName =
            selectedPath.toString().split('/').pop()?.replace('.toml', '') ||
            '';
          setProjectName(fileName);
        }
      }
    } catch (err) {
      console.error('Error selecting config file:', err);
    }
  };

  const handleProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    setIsCreating(true);

    try {
      // Determine project directory from config file or create a unique path
      let projectDir = '';
      if (configPath) {
        projectDir = configPath.substring(0, configPath.lastIndexOf('/'));
      } else {
        // Create a unique project path when no config file is selected
        projectDir = `/Projects/${projectName.trim()}`;
      }

      // First add to recent projects with the new data
      addRecentProject({
        name: projectName.trim(),
        path: projectDir,
        configPath: configPath || '',
      });

      // Then update current project state
      setCurrentProject(projectName.trim());
      setCurrentProjectPath(projectDir);
      setCurrentConfigPath(configPath || '');

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProjectName('');
    setConfigPath('');
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const isValid = projectName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project by providing a name and config file
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Project Name */}
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Config File */}
          <div className="grid gap-2">
            <Label htmlFor="config-file">Configuration File (TOML)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="config-file"
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
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleProject}
            disabled={!isValid || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
