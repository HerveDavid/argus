import React, { useEffect, useState, useMemo } from 'react';
import { Search, Settings } from 'lucide-react';
import ProjectItem from '@/features/projects/components/project-item';
import { useProjectsStore } from '@/features/projects/stores/use-projects-store';

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
    <div className="h-screen flex bg-gray-900 text-gray-300">
      <div className="w-64 flex flex-col bg-gray-800">
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded">
            <img
              src="/api/placeholder/32/32"
              alt="Argus"
              className="w-full h-full"
            />
          </div>
          <div>
            <div className="text-sm">Argus</div>
            <div className="text-xs text-gray-500">0.0.1</div>
          </div>
        </div>
        <nav className="flex-1">
          <div className="p-2">
            <div className="bg-blue-600 text-white px-4 py-2 rounded">
              Projects
            </div>
          </div>
        </nav>
        <div className="p-4">
          <Settings size={20} />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-4 p-2 bg-gray-800">
          <div className="flex-1 flex items-center gap-2 bg-gray-700 rounded px-3 py-1">
            <Search size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects"
              className="bg-transparent border-none outline-none w-full text-sm"
            />
          </div>
          <button className="px-4 py-1 bg-blue-600 rounded text-sm">
            New Project
          </button>
          <button className="px-4 py-1 bg-gray-700 rounded text-sm">
            Open
          </button>
        </div>
        <div className="p-4 space-y-4">
          {filteredProjects.map((project) => (
            <ProjectItem key={project.path} {...project} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeRoute;
