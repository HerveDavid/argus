import React, { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';

import ProjectItem from '@/features/projects/components/project-item';
import { useProjectsStore } from '@/features/projects/stores/use-projects-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateProject } from '@/features/projects/components/create-project';
import SingleLineDiagram from '@/features/diagram/components/single-line-diagram';
import MetadataTable from '@/features/diagram/components/metadata-table';
import NetworkAreaDiagram from '@/features/diagram/components/network-area-diagram';
import { ProxyForm, ProxyFormContainer } from '@/features/configuration/proxy/components/proxy-form';

const HomeRoute: React.FC = () => {
  const { projects, fetchProjects } = useProjectsStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(lowerTerm),
    );
  }, [projects, searchTerm]);

  return (
    <div className="h-screen flex p-2">
      <div className="flex-1">
        <div className="flex items-center gap-4 p-2">
          <div className="flex-1 flex items-center gap-2 rounded px-3 py-1">
            <Search size={16} />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects"
              className="outline-none w-full text-sm"
            />
          </div>

          <CreateProject />
          <Button variant="outline" className="px-4 py-1 text-sm">
            Open
          </Button>
        </div>
        <div className="p-4 space-y-4">
          {filteredProjects.map((project) => (
            <ProjectItem key={project.path} {...project} />
          ))}
        </div>
        <ProxyFormContainer />
        <SingleLineDiagram />
        <NetworkAreaDiagram />
        <MetadataTable />
      </div>
    </div>
  );
};

export default HomeRoute;
