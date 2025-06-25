import { useState } from 'react';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
  Search,
  Loader2,
  MapPin,
  ChevronLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEquipment } from '../hooks/use-equipment';
import DraggableItem from './draggable-item';
import { Substation, VoltageLevel } from '@/types/substation';

interface SubstationQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  tso?: string;
}

const formatVoltage = (voltage: number) => {
  if (voltage >= 1000000) {
    return `${(voltage / 1000000).toFixed(0)}MV`;
  } else if (voltage >= 1000) {
    return `${(voltage / 1000).toFixed(0)}kV`;
  }
  return `${voltage}V`;
};

const getVoltageLevelColor = (voltage: number) => {
  if (voltage >= 400000) return 'text-destructive';
  if (voltage >= 200000) return 'text-warning';
  if (voltage >= 100000) return 'text-info';
  if (voltage >= 50000) return 'text-success';
  return 'text-primary';
};

const getTopologyIcon = (topology: string) => {
  switch (topology) {
    case 'NODE_BREAKER':
      return '🔗';
    case 'BUS_BREAKER':
      return '🔌';
    default:
      return '⚡';
  }
};

interface FileTreeItemProps {
  item: {
    id: string;
    name: string;
    type: 'substation' | 'voltage_level';
    substation?: Substation;
    voltageLevel?: VoltageLevel;
    children?: any[];
  };
  level?: number;
  expanded?: boolean;
  onToggle?: () => void;
}

const FileTreeItem = ({
  item,
  level = 0,
  expanded = false,
  onToggle,
}: FileTreeItemProps) => {
  const handleToggle = () => {
    if (item.type === 'substation' && onToggle) {
      onToggle();
    }
  };

  if (item.type === 'substation' && item.substation) {
    const sub = item.substation;
    return (
      <div>
        <div
          className="flex items-center py-3 px-4 cursor-pointer hover:bg-accent/50 rounded-sm border-b"
          style={{ paddingLeft: `${level * 12 + 16}px` }}
          onClick={handleToggle}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 mr-2 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2 text-muted-foreground" />
          )}
          {expanded ? (
            <FolderOpen className="w-5 h-5 mr-3 text-primary" />
          ) : (
            <Folder className="w-5 h-5 mr-3 text-primary" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-foreground">
                  {sub.id}
                </span>
                <span className="text-sm text-muted-foreground">
                  {sub.name || 'Sans nom'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {sub.tso}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {sub.country}
                </div>
                <span className="text-xs text-muted-foreground">
                  {sub.voltage_levels?.length || 0} niveau
                  {(sub.voltage_levels?.length || 0) > 1 ? 'x' : ''}
                </span>
              </div>
            </div>
            {sub.geo_tags && (
              <div className="text-xs text-muted-foreground font-mono mt-1">
                📍 {sub.geo_tags}
              </div>
            )}
          </div>
        </div>

        {expanded && item.children && (
          <div className="bg-muted/30">
            {item.children.map((child: any, index: number) => (
              <FileTreeItem key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'voltage_level' && item.voltageLevel) {
    const vl = item.voltageLevel;
    return (
      <div
        className="flex items-center py-2 px-4 hover:bg-accent/30 rounded-sm"
        style={{ paddingLeft: `${level * 12 + 20}px` }}
      >
        <div className="w-4 h-4 mr-2" />
        <File className="w-4 h-4 mr-3 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-foreground">{vl.id}</span>
              <span className="text-sm text-muted-foreground">
                {vl.name || 'Sans nom'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-bold text-sm ${getVoltageLevelColor(vl.nominal_v)}`}
              >
                {formatVoltage(vl.nominal_v)}
              </span>
              <span className="text-xs text-muted-foreground">
                {getTopologyIcon(vl.topology_kind)} {vl.topology_kind}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span>Min: {formatVoltage(vl.low_voltage_limit)}</span>
            <span>Max: {formatVoltage(vl.high_voltage_limit)}</span>
            {vl.fictitious && (
              <Badge variant="destructive" className="text-xs">
                ⚠️ Fictif
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const EquipmentExplorer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSubstations, setExpandedSubstations] = useState<Set<string>>(
    new Set(),
  );
  const pageSize = 10;

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
            Erreur lors du chargement des données
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto border-none shadow-none">
      <CardHeader className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par ID, nom, pays, TSO ou niveau de tension..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
            <span className="text-muted-foreground">
              Chargement des postes...
            </span>
          </div>
        ) : (
          <>
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
                  ? 'Tout replier'
                  : 'Tout déplier'}
              </Button>
            </div>

            <Card className="border-none">
              {treeData.length === 0 ? (
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucun poste trouvé
                </CardContent>
              ) : (
                <div className="divide-y divide-border">
                  {treeData.map((item) => (
                    <DraggableItem substation={item.substation} key={item.id}>
                      <FileTreeItem
                        key={item.id}
                        item={item}
                        level={0}
                        expanded={expandedSubstations.has(item.id)}
                        onToggle={() => toggleSubstation(item.id)}
                      />
                    </DraggableItem>
                  ))}
                </div>
              )}
            </Card>

            {data && data.totalPages > 1 && (
              <>
                <Separator />
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

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, data.totalPages) },
                        (_, i) => {
                          const pageNum = i + 1;
                          const isCurrentPage = pageNum === currentPage;
                          return (
                            <Button
                              key={pageNum}
                              variant={isCurrentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-10 h-10 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>

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
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
