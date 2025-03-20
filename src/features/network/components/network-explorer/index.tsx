import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubstationList } from './substation-list';
import { PaginationControls } from './pagination-controls';

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
  } = substationsData;

  const renderError = (error: unknown, retryFunction: () => void) => {
    if (!error) return null;

    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred';

    return (
      <Alert variant="destructive" className="m-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={retryFunction}
            className="ml-2 h-6 text-xs"
          >
            Retry
          </Button>
        </AlertDescription>
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
    <div className="w-2/12 flex flex-col border-r border-gray-200">
      <div className="flex justify-between items-center border-b border-gray-200 p-2">
        <h2 className="font-semibold">Network Explorer</h2>
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

      {initialDataCheck.error &&
        renderError(initialDataCheck.error, initialDataCheck.refetch)}
      {substationsQuery.error &&
        renderError(substationsQuery.error, substationsQuery.refetch)}

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
