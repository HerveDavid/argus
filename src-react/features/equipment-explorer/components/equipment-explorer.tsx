import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Folder,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
  Search, 
  Loader2,
  MapPin,
  Zap,
  ChevronLeft
} from 'lucide-react';

// Types basés sur votre code
interface VoltageLevel {
  id: string;
  name: string;
  substation_id: string;
  nominal_v: number;
  high_voltage_limit: number;
  low_voltage_limit: number;
  fictitious: boolean;
  topology_kind: string;
}

interface Substation {
  id: string;
  name: string;
  tso: string;
  geo_tags: string;
  country: string;
  fictitious: boolean;
  voltage_levels: VoltageLevel[];
}

interface SubstationQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  tso?: string;
}

interface SubstationQueryResponse {
  substations: Substation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Import du hook réel
import { useEquipment } from '../hooks/use-equipment';

const formatVoltage = (voltage: number) => {
  if (voltage >= 1000000) {
    return `${(voltage / 1000000).toFixed(0)}MV`;
  } else if (voltage >= 1000) {
    return `${(voltage / 1000).toFixed(0)}kV`;
  }
  return `${voltage}V`;
};

const getVoltageLevelColor = (voltage: number) => {
  if (voltage >= 400000) return 'text-red-600';
  if (voltage >= 200000) return 'text-orange-600';
  if (voltage >= 100000) return 'text-yellow-600';
  if (voltage >= 50000) return 'text-green-600';
  return 'text-blue-600';
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

const FileTreeItem = ({ item, level = 0, expanded = false, onToggle }: FileTreeItemProps) => {
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
          className="flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded-sm border-b border-gray-100"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={handleToggle}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 mr-2 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2 text-gray-600" />
          )}
          {expanded ? (
            <FolderOpen className="w-5 h-5 mr-3 text-blue-500" />
          ) : (
            <Folder className="w-5 h-5 mr-3 text-blue-500" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-gray-900">{sub.id}</span>
                <span className="text-sm text-gray-600">{sub.name || 'Sans nom'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {sub.tso}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {sub.country}
                </div>
                <span className="text-xs text-gray-400">
                  {sub.voltage_levels?.length || 0} niveau{(sub.voltage_levels?.length || 0) > 1 ? 'x' : ''}
                </span>
              </div>
            </div>
            {sub.geo_tags && (
              <div className="text-xs text-gray-400 font-mono mt-1">
                📍 {sub.geo_tags}
              </div>
            )}
          </div>
        </div>
        
        {expanded && item.children && (
          <div className="bg-gray-50">
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
        className="flex items-center py-2 px-3 hover:bg-gray-100 rounded-sm"
        style={{ paddingLeft: `${level * 12 + 20}px` }}
      >
        <div className="w-4 h-4 mr-2" />
        <File className="w-4 h-4 mr-3 text-gray-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-700">{vl.id}</span>
              <span className="text-sm text-gray-600">{vl.name || 'Sans nom'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-sm ${getVoltageLevelColor(vl.nominal_v)}`}>
                {formatVoltage(vl.nominal_v)}
              </span>
              <span className="text-xs text-gray-500">
                {getTopologyIcon(vl.topology_kind)} {vl.topology_kind}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
            <span>Min: {formatVoltage(vl.low_voltage_limit)}</span>
            <span>Max: {formatVoltage(vl.high_voltage_limit)}</span>
            {vl.fictitious && <span className="text-orange-500">⚠️ Fictif</span>}
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
  const [expandedSubstations, setExpandedSubstations] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const queryParams: SubstationQueryParams = {
    page: currentPage,
    pageSize,
    search: searchTerm || undefined
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

  const treeData = data?.substations?.map(substation => ({
    id: substation.id,
    name: substation.name,
    type: 'substation' as const,
    substation,
    children: substation.voltage_levels
      ?.sort((a, b) => (b.nominal_v || 0) - (a.nominal_v || 0))
      .map(vl => ({
        id: vl.id,
        name: vl.name,
        type: 'voltage_level' as const,
        voltageLevel: vl
      }))
  })) || [];

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg border">
        <div className="p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des données
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="border-b p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Zap className="h-6 w-6 text-blue-600" />
          Explorateur d'Équipements - Postes électriques
        </h2>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID, nom, pays, TSO ou niveau de tension..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
            <span>Chargement des postes...</span>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="mb-4 text-sm text-gray-600 flex items-center justify-between">
              <span>
                {data?.total || 0} poste(s) trouvé(s)
                {searchTerm && ` pour "${searchTerm}"`}
              </span>
              <button
                onClick={() => {
                  if (expandedSubstations.size === treeData.length) {
                    setExpandedSubstations(new Set());
                  } else {
                    setExpandedSubstations(new Set(treeData.map(item => item.id)));
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {expandedSubstations.size === treeData.length ? 'Tout replier' : 'Tout déplier'}
              </button>
            </div>

            {/* Tree View */}
            <div className="border rounded-lg bg-white">
              {treeData.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Aucun poste trouvé
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
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

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Page {data.page} sur {data.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </button>
                  
                  {/* Numéros de page */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isCurrentPage = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 text-sm font-medium rounded-md border ${
                            isCurrentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= data.totalPages}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};