import { memo, useMemo } from 'react';
import { Table, Row } from '@tanstack/react-table';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';

// Schémas Zod
const BusNodeSchema = z.object({
  svgId: z.string(),
  equipmentId: z.string(),
  nbNeighbours: z.number(),
  index: z.number(),
  vlNode: z.string(),
});

const NodeSchema = z.object({
  svgId: z.string(),
  equipmentId: z.string(),
  x: z.number(),
  y: z.number(),
});

const EdgeSchema = z.object({
  svgId: z.string(),
  equipmentId: z.string(),
  node1: z.string(),
  node2: z.string(),
  busNode1: z.string(),
  busNode2: z.string(),
  type: z.string(),
});

// Types exportés
export type BusNode = z.infer<typeof BusNodeSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;

// Composant Actions mémorisé
const ActionCell = memo(
  ({ row, type }: { row: any; type: 'busNode' | 'node' | 'edge' }) => {
    const item = row.original;

    const getMenuItems = () => {
      switch (type) {
        case 'busNode':
          return <DropdownMenuItem>View details</DropdownMenuItem>;
        case 'node':
          return <DropdownMenuItem>View coordinates</DropdownMenuItem>;
        case 'edge':
          return <DropdownMenuItem>View connections</DropdownMenuItem>;
      }
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(item.equipmentId)}
          >
            Copy Equipment ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {getMenuItems()}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

// Composant SelectionHeader mémorisé
const SelectionHeader = ({ table }: { table: Table<any> }) => (
  <Checkbox
    checked={
      table.getIsAllPageRowsSelected() ||
      (table.getIsSomePageRowsSelected() && 'indeterminate')
    }
    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    aria-label="Select all"
  />
);

// Composant SelectionCell mémorisé
const SelectionCell = ({ row }: { row: Row<any> }) => (
  <Checkbox
    checked={row.getIsSelected()}
    onCheckedChange={(value) => row.toggleSelected(!!value)}
    aria-label="Select row"
  />
);

// Hook personnalisé pour les colonnes de BusNode
export const useBusNodeColumns = () => {
  return useMemo<ColumnDef<BusNode>[]>(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionCell row={row} type="busNode" />,
      },
      {
        accessorKey: 'svgId',
        header: ({ column }) => (
          <div className="flex items-center">
            <h1>SVG ID</h1>
            <Button
              variant="ghost"
              className="hover:bg-foreground-muted hover:text-foreground"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              <ArrowUpDown />
            </Button>
          </div>
        ),
      },
      {
        accessorKey: 'nbNeighbours',
        header: 'Neighbours',
        cell: ({ row }) => <div>{row.getValue('nbNeighbours')}</div>,
      },
      {
        id: 'select',
        header: ({ table }) => <SelectionHeader table={table} />,
        cell: ({ row }) => <SelectionCell row={row} />,
      },
    ],
    [],
  );
};

// Hook personnalisé pour les colonnes de Node
export const useNodeColumns = () => {
  return useMemo<ColumnDef<Node>[]>(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionCell row={row} type="node" />,
      },
      {
        accessorKey: 'svgId',
        header: 'SVG ID',
      },
      {
        accessorKey: 'x',
        header: 'X',
        cell: ({ row }) => <div>{row.getValue('x')}</div>,
      },
      {
        accessorKey: 'y',
        header: 'Y',
        cell: ({ row }) => <div>{row.getValue('y')}</div>,
      },
      {
        id: 'select',
        header: ({ table }) => <SelectionHeader table={table} />,
        cell: ({ row }) => <SelectionCell row={row} />,
      },
    ],
    [],
  );
};

// Hook personnalisé pour les colonnes de Edge
export const useEdgeColumns = () => {
  return useMemo<ColumnDef<Edge>[]>(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <ActionCell row={row} type="edge" />,
      },
      {
        accessorKey: 'type',
        header: 'Type',
      },
      {
        accessorKey: 'node1',
        header: 'Node 1',
      },
      {
        accessorKey: 'node2',
        header: 'Node 2',
      },
      {
        id: 'select',
        header: ({ table }) => <SelectionHeader table={table} />,
        cell: ({ row }) => <SelectionCell row={row} />,
      },
    ],
    [],
  );
};
