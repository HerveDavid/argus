import React, { useState, useEffect } from 'react';
import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/network/components/single-line-diagram';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Import shadcn/ui components
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getPaginatedSubstations } from '@/features/network/api/get-substations';
import { Substation } from '@/features/network/types/substation.type';
import { PaginatedResponse } from '@/features/network/types/substation.type';

const HomeRoute: React.FC = () => {
  const [diagramId, setDiagramId] = useState<string>();
  const [substations, setSubstations] = useState<Substation[]>([]);
  const [loadingSubstations, setLoadingSubstations] = useState<boolean>(true);
  const [substationsError, setSubstationsError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Fetch paginated substations
  const loadSubstations = async (page: number = 1, perPage: number = 20) => {
    try {
      setLoadingSubstations(true);
      setSubstationsError(null);

      const paginatedData: PaginatedResponse<Substation[]> =
        await getPaginatedSubstations({
          page: page,
          per_page: perPage,
        });

      setSubstations(paginatedData.items);
      setCurrentPage(paginatedData.page);
      setTotalPages(paginatedData.total_pages);
      setTotalItems(paginatedData.total);
    } catch (error) {
      console.error('Error fetching substations:', error);
      setSubstationsError(
        `Failed to fetch substations: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setLoadingSubstations(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadSubstations(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleItemClick = (id: string): void => {
    setDiagramId(id);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const renderError = (error: string | null, retryFunction: () => void) => {
    if (!error) return null;

    return (
      <Alert variant="destructive" className="m-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs flex items-center justify-between">
          <span>{error}</span>
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

  return (
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        <div className="w-2/12 flex flex-col border-r border-gray-200">
          <div className="flex flex-col border-b border-gray-200">
            <h2 className="font-semibold p-2">Network Explorer</h2>
          </div>

          {renderError(substationsError, () =>
            loadSubstations(currentPage, itemsPerPage),
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {loadingSubstations ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading substations...</p>
              </div>
            ) : substations.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                {substationsError
                  ? 'Error loading substations'
                  : 'No substations found'}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {substations.map((substation) => (
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
                    {totalItems > 0 ? (
                      <span>
                        {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
                        {totalItems}
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
                      disabled={currentPage <= 1 || loadingSubstations}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <span className="text-xs px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={goToNextPage}
                      disabled={currentPage >= totalPages || loadingSubstations}
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
