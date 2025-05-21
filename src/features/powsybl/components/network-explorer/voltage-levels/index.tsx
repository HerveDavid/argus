import React, {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VoltageLevelsList } from './voltage-levels-list';
import { PaginationControls } from '../pagination-controls';
import { ErrorWithRetry } from '../../../hooks/use-error-handling';
import { useVoltageLevels } from '../../../hooks/use-voltage-levels';
import { paths } from '@/config/paths';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ExplorerRef {
  handleLoadAll: () => void;
}

export const VoltageLevelsExplorer = forwardRef<ExplorerRef>((_props, ref) => {
  const {
    initialDataCheck,
    voltageLevelsQuery,
    handleLoadAllVoltageLevels,
    loadAllVoltageLevelsMutation,
    currentPage,
    itemsPerPage,
    goToNextPage,
    goToPreviousPage,
    errors,
    // Search functionality
    searchQuery,
    isSearching,
    handleSearch,
    clearSearch,
    searchFields,
    setSearchFields,
  } = useVoltageLevels(15);

  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  //Expse handleLoadAll
  useImperativeHandle(ref, () => ({
    handleLoadAll: handleLoadAllVoltageLevels,
  }));

  // Debounce search to avoid too many queries while typing
  const debouncedSearch = useCallback(
    (value: string) => {
      handleSearch(value, searchFields);
    },
    [handleSearch, searchFields],
  );

  // Handle search input changes
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Use setTimeout to create a simple debounce
    const timeoutId = setTimeout(() => {
      debouncedSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Toggle a search field
  const toggleSearchField = (field: string) => {
    if (!searchFields) {
      setSearchFields([field]);
      handleSearch(searchQuery, [field]);
      return;
    }

    const newFields = searchFields.includes(field)
      ? searchFields.filter((f) => f !== field)
      : [...searchFields, field];

    setSearchFields(newFields.length ? newFields : undefined);
    handleSearch(searchQuery, newFields.length ? newFields : undefined);
  };

  const renderError = ({ error, retry }: ErrorWithRetry) => {
    return (
      <Alert variant="destructive" className="m-2 p-2">
        <div className="flex items-center w-full">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-xs truncate">
              {error.message}
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            className="ml-2 h-6 text-xs shrink-0"
          >
            Retry
          </Button>
        </div>
      </Alert>
    );
  };

  const renderLoadDataPrompt = () => {
    if (initialDataCheck.isLoading) {
      return (
        <div className="text-center p-4">Checking data availability...</div>
      );
    }

    if (initialDataCheck.data === false) {
      return (
        <div className="text-center p-4 flex flex-col items-center space-y-3">
          <p className="text-gray-500">No substation data loaded</p>
          <Button
            onClick={handleLoadAllVoltageLevels}
            disabled={loadAllVoltageLevelsMutation.isPending}
            className="flex items-center space-x-2"
          >
            {loadAllVoltageLevelsMutation.isPending && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
            <span>Load VoltageLevels</span>
          </Button>
        </div>
      );
    }

    return null;
  };

  const renderSearchBar = () => {
    return (
      <div className="border-b border-gray-200 p-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search voltage-levels..."
            value={inputValue}
            onChange={handleSearchInput}
            className="pl-8 h-8 text-sm"
          />
          {isSearching && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearSearch();
                setInputValue('');
              }}
              className="absolute right-1 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search field filters */}
        {initialDataCheck.data && (
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge
              variant={
                !searchFields || searchFields.includes('id')
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer text-xs h-5"
              onClick={() => toggleSearchField('id')}
            >
              Id
            </Badge>
            <Badge
              variant={
                !searchFields || searchFields.includes('high_voltage_limit')
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer text-xs h-5"
              onClick={() => toggleSearchField('high_voltage_limit')}
            >
              High Voltage
            </Badge>
            <Badge
              variant={
                !searchFields || searchFields.includes('low_voltage_limit')
                  ? 'default'
                  : 'outline'
              }
              className="cursor-pointer text-xs h-5"
              onClick={() => toggleSearchField('low_voltage_limit')}
            >
              Low Voltage
            </Badge>
          </div>
        )}

        {/* Search results info */}
        {isSearching && voltageLevelsQuery.data && (
          <div className="text-xs text-gray-500 mt-1">
            Found {voltageLevelsQuery.data.total} results for "{searchQuery}"
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      {initialDataCheck.data && renderSearchBar()}

      {/* Render all errors */}
      {Object.entries(errors).map(([key, errorData]) => (
        <React.Fragment key={key}>{renderError(errorData)}</React.Fragment>
      ))}

      {/* Modified structure to create separate scrollable section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          {voltageLevelsQuery.isLoading ||
          (initialDataCheck.isLoading && !initialDataCheck.data) ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading voltage-levels...</p>
            </div>
          ) : !voltageLevelsQuery.data ||
            voltageLevelsQuery.data.items.length === 0 ? (
            isSearching ? (
              <div className="text-center p-4">
                <p className="text-gray-500">
                  No voltage-levels found matching your search
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearSearch();
                    setInputValue('');
                  }}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              </div>
            ) : (
              renderLoadDataPrompt()
            )
          ) : (
            /* Scrollable substation list */
            <VoltageLevelsList
              voltageLevels={voltageLevelsQuery.data.items}
              onSelect={(id) => {
                navigate(paths.views.stateView.getHref(id));
              }}
              isLoading={voltageLevelsQuery.isLoading}
            />
          )}
        </div>

        {/* Non-scrollable pagination section */}
        {voltageLevelsQuery.data &&
          voltageLevelsQuery.data.items.length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <PaginationControls
                currentPage={currentPage}
                totalPages={voltageLevelsQuery.data.total_pages}
                totalItems={voltageLevelsQuery.data.total}
                itemsPerPage={itemsPerPage}
                isLoading={voltageLevelsQuery.isFetching}
                onNextPage={goToNextPage}
                onPreviousPage={goToPreviousPage}
              />
            </div>
          )}
      </div>
    </div>
  );
});

VoltageLevelsExplorer.displayName = 'VoltageLevelsExplorer';
