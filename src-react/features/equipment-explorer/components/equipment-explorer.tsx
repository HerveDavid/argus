// components/equipment-explorer.tsx
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEquipment } from '../hooks/use-equipment';
import { SubstationQueryParams } from '../types/equipment-query.type';
import { FileTreeItem } from './file-tree-item';
import { Header } from './header';
import { Footer } from './footer';
import { useEquipmentStore } from '../stores/equipement.store';

export const EquipmentExplorer = () => {
  // Récupération de l'état et des actions depuis le store Zustand
  const {
    searchTerm,
    currentPage,
    expandedSubstations,
    pageSize,
    handleSearch,
    handlePageChange,
    toggleSubstation,
    setExpandedSubstations,
  } = useEquipmentStore();

  // Paramètres de requête basés sur l'état du store
  const queryParams: SubstationQueryParams = {
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
  };

  const { data, isLoading, error } = useEquipment(queryParams);

  // Transformation des données pour l'affichage en arbre
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
      <Header
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        data={data}
        treeData={treeData}
        expandedSubstations={expandedSubstations}
        setExpandedSubstations={setExpandedSubstations}
      />

      {/* Zone scrollable centrale */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <span className="text-muted-foreground">
              Loading substations...
            </span>
          </div>
        ) : treeData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No substation finded
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
        <Footer
          data={data}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
        />
      )}
    </div>
  );
};