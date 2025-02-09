import { useEffect, useState } from 'react';
import { getMetadataGrid } from '../../api/get-metadata-grid';
import { busNodeColumns, nodeColumns, edgeColumns } from './columns';
import { DataTable } from './data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MetadataGrid } from '../../types/metadata-grid';
export default function Structure() {
  const [metadataGrid, setMetadataGrid] = useState<MetadataGrid | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getMetadataGrid();
        setMetadataGrid(response.data);
      } catch (error) {
        console.error('Error fetching metadata grid:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }
  if (!metadataGrid) {
    return <div className="container mx-auto py-10">No data available</div>;
  }
  return (
    <div className="container">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Network Structure</CardTitle>
          <CardDescription>
            View and manage network components: Bus Nodes, Nodes, and Edges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="busNodes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="busNodes">
                Bus Nodes ({metadataGrid.busNodes.length})
              </TabsTrigger>
              <TabsTrigger value="nodes">
                Nodes ({metadataGrid.nodes.length})
              </TabsTrigger>
              <TabsTrigger value="edges">
                Edges ({metadataGrid.edges.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="busNodes">
              <Card>
                <CardHeader>
                  <CardTitle>Bus Nodes</CardTitle>
                  <CardDescription>
                    List of all bus nodes in the network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    columns={busNodeColumns}
                    data={metadataGrid.busNodes}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="nodes">
              <Card>
                <CardHeader>
                  <CardTitle>Nodes</CardTitle>
                  <CardDescription>
                    List of all nodes with their coordinates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable columns={nodeColumns} data={metadataGrid.nodes} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="edges">
              <Card>
                <CardHeader>
                  <CardTitle>Edges</CardTitle>
                  <CardDescription>
                    List of all connections between nodes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable columns={edgeColumns} data={metadataGrid.edges} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
