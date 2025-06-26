import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { SubstationQueryResponse } from '../types/equipment-query.type';
import React from 'react';
import { TreeData } from '../types/tree-data.type';

interface HeaderProps {
  searchTerm: string;
  handleSearch: (value: string) => void;
  data: SubstationQueryResponse;
  treeData: TreeData[];
  expandedSubstations: Set<String>;
  setExpandedSubstations: (value: React.SetStateAction<Set<string>>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  handleSearch,
  data,
  treeData,
  expandedSubstations,
  setExpandedSubstations,
}) => {
  return (
    <div className="flex-shrink-0 space-y-4 p-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search ID, name, TSO or voltage levels..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data?.total || 0} substation
          {(data?.total || 0) > 1 ? 's' : ''}
          {searchTerm && ` for "${searchTerm}"`}
        </span>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            if (expandedSubstations.size === treeData.length) {
              setExpandedSubstations(new Set());
            } else {
              setExpandedSubstations(new Set(treeData.map((item) => item.id)));
            }
          }}
          className="h-auto p-0 text-xs"
        >
          {expandedSubstations.size === treeData.length
            ? 'All Fold'
            : 'All Unfold '}
        </Button>
      </div>
    </div>
  );
};
