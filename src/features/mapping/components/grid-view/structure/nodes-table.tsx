import { MetadataGrid } from '@/features/mapping/types/metadata-grid';
import { DataTable } from './data-table';
import { useNodeColumns } from './columns';

export default function NodesTable({ data }: { data: MetadataGrid['nodes'] }) {
  const nodeColumns = useNodeColumns();
  return <DataTable columns={nodeColumns} data={data} />;
}
