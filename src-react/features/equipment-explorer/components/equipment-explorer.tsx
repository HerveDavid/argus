import { useState } from 'react';
import {
  ChevronRight,
  Search,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useEquipment } from '../hooks/use-equipment';
import { SubstationQueryParams } from '../types/equipment.type';
import { FileTreeItem } from './file-tree-item';

export const EquipmentExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSubstations, setExpandedSubstations] = useState<Set<string>>(
    new Set(),
  );
  const pageSize = 15;

  const queryParams: SubstationQueryParams = {
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
  };

  const { data, isLoading, error } = useEquipment(queryParams);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleSubstation = (substationId: string) => {
    const newExpanded = new Set(expandedSubstations);
    if (newExpanded.has(substationId)) {
      newExpanded.delete(substationId);
    } else {
      newExpanded.add(substationId);
    }
    setExpandedSubstations(newExpanded);
  };

  const treeData =
    data?.substations?.map((substation) => ({
      id: substation.id,
      name: substation.name,
      type: 'substation' as const,
      substation,
      children: substation.voltage_levels
        ?.sort((a, b) => (b.nominal_v || 0) - (a.nominal_v || 0))
        .map((vl) => ({
          id: vl.id,
          name: vl.name,
          type: 'voltage_level' as const,
          voltageLevel: vl,
        })),
    })) || [];

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error when loading substations
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex-shrink-0 space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ID, name, country, TSO or voltage levels..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data?.total || 0} poste(s) trouvé(s)
            {searchTerm && ` pour "${searchTerm}"`}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              if (expandedSubstations.size === treeData.length) {
                setExpandedSubstations(new Set());
              } else {
                setExpandedSubstations(
                  new Set(treeData.map((item) => item.id)),
                );
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

      {/* Zone scrollable centrale */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <span className="text-muted-foreground">
              Chargement des postes...
            </span>
          </div>
        ) : treeData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucun poste trouvé
          </div>
        ) : (
          <div className="space-y-1">
            {treeData.map((item) => (
              <FileTreeItem
                key={item.id}
                item={item}
                level={0}
                expanded={expandedSubstations.has(item.id)}
                onToggle={() => toggleSubstation(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination fixe en bas */}
      {data && data.totalPages > 1 && (
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {data.page} sur {data.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
