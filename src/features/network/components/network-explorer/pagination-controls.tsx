import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  isLoading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  isLoading,
  onNextPage,
  onPreviousPage,
}) => {
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <div className="text-xs text-gray-500">
        {totalItems > 0 ? (
          <span>
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
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
          onClick={onPreviousPage}
          disabled={currentPage <= 1 || isLoading}
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
          onClick={onNextPage}
          disabled={currentPage >= totalPages || isLoading}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
