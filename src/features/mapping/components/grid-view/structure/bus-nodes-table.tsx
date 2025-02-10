import { MetadataGrid } from '@/features/mapping/types/metadata-grid';
import { DataTable } from './data-table';
import { BusNode, useBusNodeColumns } from './columns';

export default function BusNodesTable({
  data,
}: {
  data: MetadataGrid['busNodes'];
}) {
  const busNodeColumns = useBusNodeColumns();
  return <DataTable columns={busNodeColumns} data={data} />;
}
