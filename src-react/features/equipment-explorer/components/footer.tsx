import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SubstationQueryResponse } from '../types/equipment-query.type';
import React from 'react';

export interface FooterProps {
  data: SubstationQueryResponse;
  currentPage: number;
  handlePageChange: (page: number) => void;
}

export const Footer: React.FC<FooterProps> = ({
  data,
  currentPage,
  handlePageChange,
}) => {
  return (
    <div className="flex-shrink-0 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {data.page} on {data.totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= data.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
