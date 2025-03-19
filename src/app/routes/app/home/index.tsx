import React, { useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/network/components/single-line-diagram';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

// Import shadcn/ui components
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  getPaginatedSubstations,
  loadSubstations,
  getSubstationById,
} from '@/features/network/api/get-substations';

// Import TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const HomeRoute: React.FC = () => {
  const [diagramId, setDiagramId] = useState<string>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, _] = useState<number>(20);

  const queryClient = useQueryClient();

  // Query to check if data exists
  const initialDataCheck = useQuery({
    queryKey: ['substationsCheck'],
    queryFn: async () => {
      const result = await getPaginatedSubstations({
        page: 1,
        per_page: 1,
      });
      return result.total > 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for paginated substations
  const substationsQuery = useQuery({
    queryKey: ['substations', currentPage, itemsPerPage],
    queryFn: async () => {
      return await getPaginatedSubstations({
        page: currentPage,
        per_page: itemsPerPage,
      });
    },
    enabled: initialDataCheck.data === true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Query for selected substation details
  const _substationDetailsQuery = useQuery({
    queryKey: ['substation', diagramId],
    queryFn: async () => {
      if (!diagramId) return null;
      return await getSubstationById(diagramId);
    },
    enabled: !!diagramId,
  });

  // Mutation for loading all substations
  const loadAllSubstationsMutation = useMutation({
    mutationFn: loadSubstations,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['substationsCheck'] });
      queryClient.invalidateQueries({ queryKey: ['substations'] });
      // Reset to first page
      setCurrentPage(1);
    },
  });

  const handleLoadAllSubstations = () => {
    loadAllSubstationsMutation.mutate();
  };

  const handleItemClick = (id: string): void => {
    setDiagramId(id);
  };

  const goToNextPage = () => {
    if (
      substationsQuery.data &&
      currentPage < substationsQuery.data.total_pages
    ) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

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

  // Render a load data message when no data is available
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
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        <div className="w-2/12 flex flex-col border-r border-gray-200">
          <div className="flex justify-between items-center border-b border-gray-200 p-2">
            <h2 className="font-semibold">Network Explorer</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadAllSubstations}
              disabled={loadAllSubstationsMutation.isPending}
              title="Reload substations data"
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
                <div className="space-y-1">
                  {substationsQuery.data.items.map((substation) => (
                    <Card key={substation.id} className="p-0 shadow-sm">
                      <div
                        className={`cursor-pointer p-2 ${
                          diagramId === substation.id
                            ? 'bg-blue-100'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleItemClick(substation.id)}
                      >
                        <div className="flex items-center">
                          <span className="font-medium truncate text-sm">
                            {substation.id} ({substation.country})
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-4 px-1">
                  <div className="text-xs text-gray-500">
                    {substationsQuery.data.total > 0 ? (
                      <span>
                        {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(
                          currentPage * itemsPerPage,
                          substationsQuery.data.total,
                        )}{' '}
                        of {substationsQuery.data.total}
                      </span>
                    ) : (
                      <span>0 items</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={goToPreviousPage}
                      disabled={currentPage <= 1 || substationsQuery.isFetching}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs px-1">
                      {currentPage} / {substationsQuery.data.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={goToNextPage}
                      disabled={
                        currentPage >= substationsQuery.data.total_pages ||
                        substationsQuery.isFetching
                      }
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-10/12 flex flex-col overflow-hidden">
          <div className="flex items-center justify-center border-b border-gray-200">
            <h2 className="font-semibold p-2">
              {diagramId ? `Substation: ${diagramId}` : 'Select a substation'}
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-secondary">
            <div className="h-full w-full flex items-center justify-center border border-gray-200 rounded-md bg-background">
              {diagramId && (
                <SingleLineDiagram
                  lineId={diagramId}
                  className="w-auto h-auto max-w-full max-h-full bg-background"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
