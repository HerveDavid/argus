import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Structure from './structure';

const NetworkView = () => {
  return (
    <>
      <Tabs defaultValue="graph" className="flex-1 p-2">
        <h1 className="mb-2">Network</h1>
        <TabsList>
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
        </TabsList>
        <TabsContent value="graph">Graph</TabsContent>
        <TabsContent value="structure">
          <Structure />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default NetworkView;
