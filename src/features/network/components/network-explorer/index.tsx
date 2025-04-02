import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubstationList } from './substation-list';
import { PaginationControls } from './pagination-controls';
import { ErrorWithRetry } from '../../hooks/use-error-handling';

interface NetworkExplorerProps {
  substationsData: ReturnType<
    typeof import('../../hooks/use-substations').useSubstations
  >;
  selectedSubstationId?: string;
  onSubstationSelect: (id: string) => void;
}

export const NetworkExplorer: React.FC<NetworkExplorerProps> = ({
  substationsData,
  selectedSubstationId,
  onSubstationSelect,
}) => {
  const {
    initialDataCheck,
    substationsQuery,
    handleLoadAllSubstations,
    loadAllSubstationsMutation,
    currentPage,
    itemsPerPage,
    goToNextPage,
    goToPreviousPage,
    errors,
  } = substationsData;

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
            onClick={handleLoadAllSubstations}
            disabled={loadAllSubstationsMutation.isPending}
            className="flex items-center space-x-2"
          >
            {loadAllSubstationsMutation.isPending && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
            <span>Load Substations</span>
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center border-b border-gray-200 p-2">
        <h3 className='uppercase text-sm'>Network Explorer</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLoadAllSubstations}
          disabled={loadAllSubstationsMutation.isPending}
          title="Reload substations"
          className="h-7 w-7 p-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loadAllSubstationsMutation.isPending ? 'animate-spin' : ''
            }`}
          />
        </Button>
      </div>

      {/* Render all errors */}
      {Object.entries(errors).map(([key, errorData]) => (
        <React.Fragment key={key}>{renderError(errorData)}</React.Fragment>
      ))}

      <div className="flex-1 overflow-y-auto p-2">
        {substationsQuery.isLoading ||
        (initialDataCheck.isLoading && !initialDataCheck.data) ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading substations...</p>
          </div>
        ) : !substationsQuery.data ||
          substationsQuery.data.items.length === 0 ? (
          renderLoadDataPrompt()
        ) : (
          <>
            <SubstationList
              substations={substationsQuery.data.items}
              selectedId={selectedSubstationId}
              onSelect={onSubstationSelect}
              isLoading={substationsQuery.isLoading}
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={substationsQuery.data.total_pages}
              totalItems={substationsQuery.data.total}
              itemsPerPage={itemsPerPage}
              isLoading={substationsQuery.isFetching}
              onNextPage={goToNextPage}
              onPreviousPage={goToPreviousPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
