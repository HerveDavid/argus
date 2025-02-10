import { MetadataGrid } from '@/features/mapping/types/metadata-grid';
import { DataTable } from './data-table';
import { useEdgeColumns } from './columns';

export default function EdgesTable({ data }: { data: MetadataGrid['edges'] }) {
  const edgeColumns = useEdgeColumns();
  return <DataTable columns={edgeColumns} data={data} />;
}
