import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getMetadataGrid } from '@/features/mapping/api/get-metadata-grid';
import { MetadataGrid } from '@/features/mapping/types/metadata-grid';
import BusNodesTable from './bus-nodes-table';
import EdgesTable from './edges-table';
import NodesTable from './nodes-table';


export default function Structure() {
  const [metadataGrid, setMetadataGrid] = useState<MetadataGrid | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'busNodes' | 'nodes' | 'edges'>(
    'busNodes',
  );
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await getMetadataGrid({
        page: currentPage,
        pageSize,
        tabType: currentTab,
      });
      setMetadataGrid(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching metadata grid:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, currentTab]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value as 'busNodes' | 'nodes' | 'edges');
    setCurrentPage(0);
  };

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  if (!metadataGrid) {
    return <div className="container mx-auto py-10">No data available</div>;
  }

  const renderTable = () => {
    switch (currentTab) {
      case 'busNodes':
        return <BusNodesTable data={metadataGrid.busNodes} />;
      case 'nodes':
        return <NodesTable data={metadataGrid.nodes} />;
      case 'edges':
        return <EdgesTable data={metadataGrid.edges} />;
    }
  };

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
          <Tabs
            value={currentTab}
            className="w-full"
            onValueChange={handleTabChange}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="busNodes">Bus Nodes</TabsTrigger>
              <TabsTrigger value="nodes">Nodes</TabsTrigger>
              <TabsTrigger value="edges">Edges</TabsTrigger>
            </TabsList>
            <TabsContent value={currentTab}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{currentTab}</CardTitle>
                  <CardDescription>
                    List of all {currentTab} in the network
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderTable()}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
