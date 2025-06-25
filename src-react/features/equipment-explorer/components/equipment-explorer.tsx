import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Zap,
  Building,
  Globe
} from 'lucide-react';
import { useEquipment } from '../hooks/use-equipment';
import { useEquipmentFilters } from '../hooks/use-equipment-filter';
import { SubstationQueryParams } from '../types/equipment.type';

export const EquipmentExplorer = () => {
  const [params, setParams] = useState<SubstationQueryParams>({
    page: 1,
    pageSize: 20,
    search: '',
    country: '',
    tso: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useEquipment(params);
  const { data: filters } = useEquipmentFilters();

  const handleSearch = () => {
    setParams(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleFilterChange = (key: keyof SubstationQueryParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const formatVoltage = (voltage: number | null | undefined) => {
    if (voltage === null || voltage === undefined || isNaN(voltage)) {
      return 'N/A';
    }
    if (voltage >= 1000) {
      return `${(voltage / 1000).toFixed(0)} kV`;
    }
    return `${voltage.toFixed(0)} V`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error loading equipment</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Equipment Explorer</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search substations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={params.country || ''}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All countries</option>
                  {filters?.countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TSO</label>
                <select
                  value={params.tso || ''}
                  onChange={(e) => handleFilterChange('tso', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All TSOs</option>
                  {filters?.tsos.map((tso) => (
                    <option key={tso} value={tso}>{tso}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-4">
            {/* Results info */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {data?.substations.length || 0} of {data?.total || 0} substations
            </div>

            {/* Substations list */}
            <div className="space-y-4">
              {data?.substations.map((substation) => (
                <div key={substation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Substation header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{substation.name}</h3>
                      <p className="text-sm text-gray-500">ID: {substation.id}</p>
                    </div>
                    {substation.fictitious && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Fictitious
                      </span>
                    )}
                  </div>

                  {/* Substation info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4" />
                      <span>{substation.country || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{substation.tso || 'N/A'}</span>
                    </div>
                    {substation.geo_tags && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{substation.geo_tags}</span>
                      </div>
                    )}
                  </div>

                  {/* Voltage levels */}
                  {substation.voltage_levels.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Voltage Levels ({substation.voltage_levels.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {substation.voltage_levels.map((vl) => (
                          <div key={vl.id} className="bg-gray-50 rounded-md p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-blue-600">
                                {formatVoltage(vl.nominal_v)}
                              </span>
                              {vl.fictitious && (
                                <span className="px-1 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                                  Fict.
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{vl.name}</p>
                            <p className="text-xs text-gray-500">
                              {vl.topology_kind} | {formatVoltage(vl.low_voltage_limit)} - {formatVoltage(vl.high_voltage_limit)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {data.page} of {data.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(data.page - 1)}
                    disabled={data.page === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(data.page + 1)}
                    disabled={data.page === data.totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};